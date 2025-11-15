import { AccountBase, CountryCode, Products, RemovedTransaction, Transaction } from "plaid";
import { AppError } from "../utils/errors";
import { plaidClient } from "./config/plaidClient";

/**
 * Base payload for creating a Plaid Link token.
 */
type BaseLinkRequestPayload = {
    user: { client_user_id: string };
    client_name: string;
    country_codes: CountryCode[];
    language: string;
};
/**
 * Payload for creating a Plaid Link token.
 * Either provide `products` for new items, or `access_token` for update mode.
 */
type LinkTokenRequestPayload = BaseLinkRequestPayload &
    (
        | {
              products: Products[];
          }
        | { access_token: string }
    );

/**
 * Create a Plaid Link token for the user.
 *
 * Throws AppError(400) if the Plaid request fails.
 *
 * @param payload - Request payload containing user info and products or access token.
 * @returns Plaid's `link_token` response object.
 */
export const linkTokenCreate = async (payload: LinkTokenRequestPayload) => {
    try {
        const response = await plaidClient.linkTokenCreate(payload);
        return response.data;
    } catch (error) {
        throw new AppError("Failed to create link token", 400, error);
    }
};

/**
 * Exchange a Plaid public token for an access token and item ID.
 *
 * Throws AppError(400) if the exchange fails.
 *
 * @param publicToken - Plaid public token from client-side Link flow.
 * @returns Object containing `accessToken` and `itemId`.
 */
export const exchangePublicToken = async (publicToken: string) => {
    try {
        const res = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken,
        });

        return {
            accessToken: res.data.access_token,
            itemId: res.data.item_id,
        };
    } catch (err) {
        console.log("error", err);
        throw new AppError("Failed to exchange public token", 400, err);
    }
};

/**
 * @deprecated
 * Don't think I need this
 */
export const fetchItemData = async (accessToken: string) => {
    const res = await plaidClient.itemGet({ access_token: accessToken });
    return res.data.item;
};

/**
 * Fetch item metadata and all linked accounts.
 *
 * @param accessToken - Plaid access token.
 * @returns Object containing `item` and `accounts` arrays.
 */
export const fetchItemAccountsData = async (accessToken: string) => {
    const res = await plaidClient.accountsGet({ access_token: accessToken });
    return { item: res.data.item, accounts: res.data.accounts };
};

/**
 * Fetch new or updated transactions since last cursor for a Plaid item.
 *
 * Uses Plaid's Transactions Sync API.
 *
 * @param accessToken - Plaid access token.
 * @param initialCursor - Optional cursor from previous sync; syncs all new transactions if provided.
 * @returns Object containing:
 *  - `accounts`: array of updated accounts,
 *  - `added`: newly added transactions,
 *  - `modified`: updated transactions,
 *  - `removed`: removed transactions,
 *  - `next_cursor`: cursor to save for the next sync,
 *  - `accessToken`: the same access token used.
 * @throws AppError(500) if the sync fails.
 */
export const fetchTransactionSync = async (accessToken: string, initialCursor?: string) => {
    // New transaction updates since "cursor"
    let added: Transaction[] = [];
    let modified: Transaction[] = [];
    // Removed transaction ids
    let removed: RemovedTransaction[] = [];
    let accountsMap: Record<string, AccountBase> = {};
    let hasMore = true;

    let cursor = initialCursor;

    const batchSize = 100;

    try {
        // Iterate through each page of new transaction updates for item
        /* eslint-disable no-await-in-loop */
        while (hasMore) {
            const request = {
                access_token: accessToken,
                cursor,
                count: batchSize,
            };
            const response = await plaidClient.transactionsSync(request);
            const data = response.data;
            // Add this page of results
            added = added.concat(data.added);
            modified = modified.concat(data.modified);
            removed = removed.concat(data.removed);
            hasMore = data.has_more;

            // Save accounts uniquely by account_id
            for (const acct of data.accounts) {
                accountsMap[acct.account_id] = acct;
            }

            // Update cursor to the next cursor
            cursor = data.next_cursor;
        }
    } catch (error) {
        cursor = initialCursor;
        throw new AppError("Failed to fetch transactions via sync", 500, error);
    }

    // Return Map to array
    const accounts = Object.values(accountsMap);

    return { accounts, added, modified, removed, next_cursor: cursor, accessToken };
};

/**
 * Fetch all historical transactions for a Plaid item.
 *
 * Duration depends on the financial institution; some allow years back, others only months.
 *
 * @param accessToken - Plaid access token.
 * @param startDate - Start date for transaction history (default: 2010-01-01).
 * @param endDate - End date for transaction history (default: now).
 * @returns Array of all transactions retrieved.
 * @throws AppError(500) if fetching transactions fails.
 */
export const getTransactions = async (accessToken: string, startDate: Date = new Date("2010-01-01"), endDate: Date = new Date()) => {
    const start_date = startDate.toISOString().substring(0, 10);
    const end_date = endDate.toISOString().substring(0, 10);
    let allTx: any[] = [];

    try {
        while (true) {
            const res = await plaidClient.transactionsGet({
                access_token: accessToken,
                start_date,
                end_date,
                options: {
                    offset: allTx.length,
                    count: 500,
                },
            });

            allTx = allTx.concat(res.data.transactions);

            if (allTx.length >= res.data.total_transactions) break;
        }

        return allTx;
    } catch (error) {
        throw new AppError("Failed to fetch transactions via get", 500, error);
    }
};
