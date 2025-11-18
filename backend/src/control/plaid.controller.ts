import { Request, Response, NextFunction } from "express";
import { exchangePublicToken, fetchItemAccountsData, fetchTransactionSync, linkTokenCreate, getTransactions } from "../services/plaid.service";
import { ItemAlreadyExistsError } from "../utils/errors";
import { CountryCode, Products } from "plaid";
import { getInstitutionByItemId, getInstitutionsByUser, saveInstitutionItemToDB, updateInstitutionItemCursor } from "../services/institution.service";
import { upsertTransactions } from "../services/transaction.service";
import { upsertAccountsToDB } from "../services/account.service";
import { AuthenticatedRequest } from "../types/auth";
import { PlaidWebhook } from "../types/plaidWebhooks";
import { mapPlaidAccount, mapPlaidTransaction } from "../utils/plaidMappingHelpers";

/**
 * Express handler for Plaid webhooks.
 *
 * Processes incoming webhook events from Plaid, logging the webhook type and code,
 * and handling transaction-related updates by calling `handleSaveItemTransactionHistory`.
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
                        await handleSaveItemTransactionHistory(item_id);
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
            webhook: `${process.env.API_URL}/plaid/webhook`,
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
    // TODO: need a version that doesn't require authentication so I can run it daily as a job
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
 * Syncs a single Plaid item:
 * - Upserts accounts
 * - Upserts added + modified transactions
 * - Updates cursor
 *
 * Returns a summary for this item.
 */
const syncItem = async (item: { access_token: string; item_id: string; cursor?: string }, userId: string) => {
    const { access_token: accessToken, item_id: itemId, cursor } = item;

    // TODO: allow cursor = null for full re-sync
    const data = await fetchTransactionSync(accessToken, cursor);
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

/**
 * Performs the initial full import of transactions for a newly-linked Plaid item.
 * Fetches the complete transaction history and upserts them into the database.
 */
const handleSaveItemTransactionHistory = async (
    /** Plaid item (institution) ID. */
    itemId: string
) => {
    const item = await getInstitutionByItemId(itemId);

    const { access_token: accessToken, user_id: userId } = item;

    const transactions = await getTransactions(accessToken);
    const formattedTx = transactions.map((t) => mapPlaidTransaction(t, userId, itemId));
    await upsertTransactions(formattedTx);
};

