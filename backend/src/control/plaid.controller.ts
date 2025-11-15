import { Request, Response, NextFunction } from "express";
import { exchangePublicToken, fetchItemAccountsData, fetchTransactionSync, linkTokenCreate, getTransactions } from "../services/plaid.service";
import { ItemAlreadyExistsError } from "../utils/errors";
import { AccountBase, CountryCode, Products, Transaction } from "plaid";
import { getInstitutionsByUser, saveInstitutionItemToDB, updateInstitutionItemCursor } from "../services/institution.service";
import { upsertTransactions } from "../services/transaction.service";
import { upsertAccountsToDB } from "../services/account.service";
import { AuthenticatedRequest } from "../types/auth";

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
 * stores the item (if new), upserts accounts, and imports full transaction history.
 * 
 * NOTE: You must use Plaid's front end login service to generate the necessary public_token.
 *
 * If the item already exists, the request continues without failing.
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

        // TODO: handle item already exists, but account is new! Don't resave item
        // Old access token will be good even for the new accounts
        try {
            await saveInstitutionItemToDB(userId, accessToken, item);
        } catch (err) {
            if (err instanceof ItemAlreadyExistsError) console.log("Item already exists → continuing");
        }

        await upsertAccountsToDB(accounts.map((a) => mapPlaidAccount(a, userId, itemId)));

        await saveTransactionHistory(accessToken, userId, itemId);

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
const saveTransactionHistory = async (
    /** Plaid access token for the item. */
    accessToken: string,
    /** ID of the authenticated user. */
    userId: string,
    /** Plaid item (institution) ID. */
    itemId: string
) => {
    const transactions = await getTransactions(accessToken);
    const formattedTx = transactions.map((t) => mapPlaidTransaction(t, userId, itemId));
    await upsertTransactions(formattedTx);
};

/**
 * Maps a Plaid Transaction object into the internal transaction schema
 * used in the database.
 *
 * @returns Mapped transaction ready for database upsert.
 * // TODO: make response the CustomTransaction type
 */
function mapPlaidTransaction(
    /** Plaid transaction object. */
    t: Transaction,
    /** User ID. */
    userId: string,
    /** Plaid item ID the transaction belongs to. */
    itemId: string
): any {
    return {
        transaction_id: t.transaction_id,
        user_id: userId,
        item_id: itemId,
        account_id: t.account_id,
        merchant_name: t.merchant_name,
        name: t.name,
        amount: t.amount,
        date: t.date,
        iso_currency_code: t.iso_currency_code,
        location: t.location.city ? `${t.location.city}, ${t.location.region}` : null,
        payment_channel: t.payment_channel,
        pending: t.pending,
        category: t.personal_finance_category?.primary,
        subcategory: t.personal_finance_category?.detailed,
        plaid_metadata: t,
    };
}

/**
 * Maps a Plaid AccountBase object into the internal account schema
 * used in the database.

* @returns Mapped account object ready for database upsert.
 */
const mapPlaidAccount = (
    /** Plaid account object. */
    a: AccountBase,
    /** User ID. */
    userId: string,
    /** Plaid item ID the account belongs to. */
    itemId: string
) => {
    return {
        user_id: userId,
        item_id: itemId,
        account_id: a.account_id,
        name: a.name,
        official_name: a.official_name,
        mask: a.mask,
        type: a.type,
        subtype: a.subtype,
        balances: a.balances,
        updated_at: new Date().toISOString(),
    };
};
