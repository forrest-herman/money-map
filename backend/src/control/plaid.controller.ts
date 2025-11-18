import { Request, Response, NextFunction } from "express";
import { exchangePublicToken, fetchItemAccountsData, fetchTransactionSync, linkTokenCreate, getTransactions } from "../services/plaid.service";
import { ItemAlreadyExistsError } from "../utils/errors";
import { CountryCode, Products } from "plaid";
import { getAllLinkedInstitutions, getInstitutionByItemId, getInstitutionsByUser, saveInstitutionItemToDB, updateInstitutionItemCursor } from "../services/institution.service";
import { upsertTransactions } from "../services/transaction.service";
import { upsertAccountsToDB } from "../services/account.service";
import { AuthenticatedRequest } from "../types/auth";
import { PlaidWebhook } from "../types/plaidWebhooks.types";
import { mapPlaidAccount, mapPlaidTransaction } from "../utils/plaidMappingHelpers";
import { Institution } from "@shared/types/institution.types";

const API_BASE_URL = process.env.RENDER_EXTERNAL_URL || process.env.API_BASE_URL;

/**
 * Express handler for Plaid webhooks.
 *
 * Processes incoming webhook events from Plaid, logging the webhook type and code,
 * and handling transaction-related updates by calling `saveItemTransactionHistory`.
 * Unhandled webhook types or codes are logged for debugging.
 *
 * Plaid requires a `200 OK` response regardless of processing outcome.
 *
 * @param {Request} req - The Express request object containing the webhook payload in `req.body`.
 * @param {Response} res - The Express response object used to send the acknowledgement.
 *
 * @returns {Promise<void>} Sends a JSON response `{ received: true }` on success or a `200` status on error.
 *
 * @example
 * app.post('/webhook', handleWebhook);
 */
export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const body = req.body as PlaidWebhook;
        const { webhook_type, webhook_code, item_id } = body;

        console.log("Plaid webhook:", webhook_type, webhook_code, item_id);

        switch (webhook_type) {
            case "TRANSACTIONS":
                switch (webhook_code) {
                    case "INITIAL_UPDATE":
                    case "HISTORICAL_UPDATE":
                        // TODO: this could possibly take too long, might need to consider adding a batch action
                        await _saveItemTransactionHistory({itemId: item_id});
                        break;

                    default:
                        console.log("Unhandled webhook code:", webhook_code);
                        break;
                }
                break;
            default:
                console.log("Unhandled webhook type:", webhook_type);
                break;
        }

        res.json({ received: true });
    } catch (err) {
        console.error("Webhook error:", err);
        res.status(200).send(); // Plaid requires 200 no matter what
    }
};

/**
 * Creates a Plaid Link Token for the authenticated user.
 *
 * If `access_token` is provided in the request body, the token is created in
 * "update mode" to allow adding new accounts to an existing Plaid item.
 * Otherwise, a new Link flow is started.
 *
 * The Plaid API response is returned directly to the client.
 *
 * @route POST /plaid/create-link-token
 * @returns {void} Sends Plaid's link_token payload as JSON.
 */
export const createLinkToken = async (req: Request, res: Response, next: NextFunction) => {
    const APP_NAME = "Money Map";
    try {
        const userId = (req as AuthenticatedRequest).user.id;

        const basePayload = {
            user: { client_user_id: userId },
            client_name: APP_NAME,
            country_codes: [CountryCode.Ca, CountryCode.Us],
            language: "en",
            webhook: `${API_BASE_URL}/plaid/webhook`,
        };

        let payload;
        // Optionally provide access token to use update mode (add account to existing item)
        const { access_token } = req.body;
        if (access_token) payload = { ...basePayload, access_token };
        else payload = { ...basePayload, products: [Products.Transactions] };

        const response = await linkTokenCreate(payload);
        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Exchanges a public_token for an access_token, fetches the Plaid item + accounts,
 * stores the item (if new), and upserts accounts.
 *
 * Transaction data is not immediately available. Plaid will respond with a webhook later.
 *
 * NOTE: You must use Plaid's front end login service to generate the necessary public_token.
 *
 * @route POST /plaid/connect
 * @returns {void} Returns `{ success: true }` when the item is linked successfully.
 */
export const connectPlaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { public_token } = req.body;
        const userId = (req as AuthenticatedRequest).user.id;

        const { accessToken, itemId } = await exchangePublicToken(public_token);

        const { item, accounts } = await fetchItemAccountsData(accessToken);

        // TODO build the Institution item here, and pass that to next function
        // TODO: handle item already exists, but account is new! Don't resave item
        // Old access token will be good even for the new accounts
        await saveInstitutionItemToDB(userId, accessToken, item);

        await upsertAccountsToDB(accounts.map((a) => mapPlaidAccount(a, userId, itemId)));

        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

/**
 * Syncs transactions for all Plaid items belonging to the authenticated user.
 *
 * For each item:
 * - Fetches new/updated transactions using the saved cursor
 * - Upserts account info and balances
 * - Upserts added + modified transactions
 * - Handles removed transactions // TODO:
 * - Updates the cursor only after a successful sync
 *
 * Returns a summary of results per item.
 */
export const syncTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;

        // Retrieve banks' access tokens
        const items = await getInstitutionsByUser(userId);

        if (!items || items.length === 0) return res.json({ message: `No items found under userId: ${userId}` });

        // Iterate through items in parallel
        const results = await Promise.allSettled(items.map((item) => syncItem(item, userId)));

        const summary = results.map((r) => {
            if (r.status === "fulfilled") {
                return { success: true, ...r.value };
            } else {
                return { success: false, reason: r.reason?.message || "Unknown error", context: r.reason?.context };
            }
        });
        const succeeded = summary.filter((r) => r.success).length;
        const failed = summary.filter((r) => !r.success).length;

        res.json({ succeeded, failed, items: summary });
    } catch (err) {
        next(err);
    }
};

/**
 * Syncs all linked institutions for all users in the system.
 *
 * This endpoint is intended to be triggered by a cron job or internal system,
 * not by end-users. It requires the `x-cron-secret` header to match the
 * environment variable `CRON_SECRET_KEY` for authorization.
 *
 * The function:
 * 1. Checks the `x-cron-secret` header for authorization.
 * 2. Fetches all users' linked institutions via `getAllLinkedInstitutions()`.
 * 3. Calls `syncItem` for each item in parallel.
 * 4. Returns a summary of succeeded and failed syncs per user/item.
 *
 * @param {Request} req - Express request object. Must include header `x-cron-secret`.
 * @param {Response} res - Express response object. Returns a JSON summary.
 * @param {NextFunction} next - Express next function for error handling.
 *
 * @returns {Promise<void>} Responds with JSON:
 *  {
 *    succeeded: number, // number of successful item syncs
 *    failed: number,    // number of failed item syncs
 *    items: Array<{
 *      user_id: string,
 *      item: object,
 *      success: boolean,
 *      reason?: string,
 *      context?: any
 *    }>
 *  }
 */
export const handleSyncAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = req.headers["x-cron-secret"];
        if (key !== process.env.CRON_SECRET_KEY) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Retrieve all users' items
        const items = await getAllLinkedInstitutions();
        if (!items || items.length === 0) {
            return res.json({ message: "No items found for any users" });
        }

        // Iterate over items in parallel
        const results = await Promise.allSettled(items.map((item) => syncItem(item, item.user_id)));

        const summary = results.map((r, idx) => {
            const item = items[idx];
            const userId = item.user_id;
            if (r.status === "fulfilled") {
                return { userId, item, success: true, ...r.value };
            } else {
                return {
                    userId,
                    item,
                    success: false,
                    reason: r.reason?.message || "Unknown error",
                    context: r.reason?.context,
                };
            }
        });

        const succeeded = summary.filter((r) => r.success).length;
        const failed = summary.filter((r) => !r.success).length;

        res.json({ succeeded, failed, items: summary });
    } catch (err) {
        next(err);
    }
};

/**
 * Syncs a single Plaid item:
 * - Upserts accounts
 * - Upserts added + modified transactions
 * - Updates cursor
 *
 * Returns a summary for this item.
 */
const syncItem = async (item: Partial<Institution> & Pick<Institution, "access_token" | "item_id">, userId: string) => {
    const { access_token: accessToken, item_id: itemId, cursor } = item;

    // TODO: allow cursor = null for full re-sync
    const data = await fetchTransactionSync(accessToken, cursor ?? undefined);
    const { accounts, added, modified, removed, next_cursor } = data;

    await upsertAccountsToDB(accounts.map((a) => mapPlaidAccount(a, userId, itemId)));

    // Upsert transactions (added + modified)
    const txToUpsert = [...added.map((t) => mapPlaidTransaction(t, userId, itemId)), ...modified.map((t) => mapPlaidTransaction(t, userId, itemId))];
    await upsertTransactions(txToUpsert);

    /**
     * // TODO: removed transactions
     * Most apps do one of the following:
     * Soft delete
     * is_deleted = true
     * Mark as reversed
     * Hide them from UI
     */

    // Once successful, update cursor
    await updateInstitutionItemCursor(userId, itemId, next_cursor);

    return {
        itemId,
        added: added.length,
        modified: modified.length,
        removed: removed.length,
    };
};


type SaveItemTransactionHistoryArgs = {
  /** Plaid item (institution) ID. */
  itemId: string
} | {
  item: Institution;
  userId: string
}

/**
 * Performs the initial full import of transactions for a Plaid item.
 *
 * This function accepts either:
 * - an `itemId`, in which case the corresponding Institution is fetched from the database, or
 * - an `item` + `userId` pair, which skips the lookup.
 *
 * It retrieves the full transaction history from Plaid, transforms the data into your
 * internal transaction format, and upserts all transactions into the database.
 *
 * @returns {Promise<{ itemId: string; added: number }>} The Plaid item ID and the number of transactions imported.
 */
const _saveItemTransactionHistory = async (args: SaveItemTransactionHistoryArgs) => {
    let item: Institution;
    let userId: string;

    if ("itemId" in args) {
      item = await getInstitutionByItemId(args.itemId);
      userId = item.user_id;
    } else {
      item = args.item
      userId = args.userId
    }

    const transactions = await getTransactions(item.access_token);
    const formattedTx = transactions.map((t) => mapPlaidTransaction(t, userId, item.item_id));
    await upsertTransactions(formattedTx);

    return {
        itemId: item.item_id,
        added: formattedTx.length,
    };
};


/**
 * Syncs a user's full historical transactions from all linked Plaid items.
 *
 * This endpoint:
 * - Retrieves all Plaid institutions linked to the authenticated user.
 * - Runs a full transaction history import for each item in parallel.
 * - Aggregates results (success & failure) and returns a summary.
 *
 * @returns JSON response containing:
 *   - `succeeded` {number} Count of successful imports.
 *   - `failed` {number} Count of failed imports.
 *   - `items` {Array} Per-item import details (success state, itemId, added count, or error info).
 */
export const handleGetUserTransactionsHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;

        // Retrieve banks' access tokens
        const items = await getInstitutionsByUser(userId);

        if (!items || items.length === 0) return res.json({ message: `No items found under userId: ${userId}` });

        // Iterate through items in parallel
        const results = await Promise.allSettled(items.map((item) => _saveItemTransactionHistory({item, userId})));

        const summary = results.map((r) => {
            if (r.status === "fulfilled") {
                return { success: true, ...r.value };
            } else {
                return { success: false, reason: r.reason?.message || "Unknown error", context: r.reason?.context };
            }
        });
        const succeeded = summary.filter((r) => r.success).length;
        const failed = summary.filter((r) => !r.success).length;

        res.json({ succeeded, failed, items: summary });
    } catch (err) {
        next(err);
    }
};