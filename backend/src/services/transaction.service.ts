import { supabase } from "./config/supabaseClient";
import { AppError } from "../utils/errors";
import type { PaginatedTransactionsResponse, PaginationParams, TransactionFilters } from "@shared/types/transaction.types";

/**
 * Fetches paginated + filtered transactions for a user.
 *
 * @returns A list of transactions and metadata.
 *
 * @example
 * const results = await getTransactions(userId, {
 *   accountId: "acc123",
 *   startDate: "2025-01-01",
 *   endDate: "2025-02-01",
 *   search: "starbucks",
 * }, {
 *   page: 1,
 *   pageSize: 25,
 * });
 */
export const getTransactions = async (
    /** The authenticated user's ID. */
    userId: string,
    /** Optional filters (accountId, date range, amount range, text search). */
    filters: TransactionFilters = {},
    /** Pagination options: page (1-based) + pageSize. */
    pagination: PaginationParams = {}
): Promise<PaginatedTransactionsResponse> => {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 100;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Base query
    let query = supabase.from("transactions").select("*", { count: "exact" }).eq("user_id", userId);

    // Filters
    if (filters.accountId) query = query.eq("account_id", filters.accountId);
    if (filters.startDate) query = query.gte("date", filters.startDate);
    if (filters.endDate) query = query.lte("date", filters.endDate);
    if (filters.minAmount !== undefined) query = query.gte("amount", filters.minAmount);
    if (filters.maxAmount !== undefined) query = query.lte("amount", filters.maxAmount);
    if (filters.category) query = query.eq("category", filters.category);

    if (filters.search) {
        // Case-insensitive search against name, merchant, or notes columns
        const searchString = `%${filters.search}%`;
        query = query.or([`name.ilike.${searchString}`, `merchant_name.ilike.${searchString}`, `notes.ilike.${searchString}`].join(","));
    }

    // Pagination
    query = query.order("date", { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) throw new AppError("Failed to fetch transactions", 500, error);

    const totalCount = count ?? 0;

    return {
        transactions: data ?? [],
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
    };
};

/**
 * Upserts multiple transactions into the database.
 *
 * Uses `transaction_id` as the conflict key.
 * // TODO: Replace `any[]` with a `CustomTransaction[]` type for full type safety.
 *
 * @param transactions - Array of transaction objects to insert or update.
 * @throws AppError if the database operation fails.
 */
export const upsertTransactions = async (transactions: any[]) => {
    // TODO: Future: should take in custom transaction with auto-tagged categories etc.
    const { error } = await supabase.from("transactions").upsert(transactions, {
        onConflict: "transaction_id",
    });
    if (error) throw new AppError("Failed to save transactions", 500, error);
    console.info(`Successfully upserted ${transactions.length} transactions`);
};

/**
 * Upserts a single transaction into the database.
 *
 * Uses `transaction_id` as the conflict key.
 *
 * @param tx - Plaid transaction object.
 * @returns Supabase upsert response.
 */
export async function upsertTransaction(tx: any) {
    return supabase.from("transactions").upsert(tx, { onConflict: "transaction_id" });
}



/**
 * Marks existing transactions as removed.
 *
 * - UPDATE ONLY (no inserts)
 * - Uses `transaction_id` as the lookup key
 * - Updates `updated_at` for auditability
 *
 * @param transactionIds - Array of Plaid transaction_ids to mark as removed
 * @throws AppError if the database operation fails
 */
export const updateRemovedTransactions = async (
  transactionIds: string[],
) => {
  if (transactionIds.length === 0) return;

  const { error } = await supabase
    .from("transactions")
    .update({
      is_removed: true,
      updated_at: new Date().toISOString(),
    })
    .in("transaction_id", transactionIds);

  if (error) {
    throw new AppError(
      "Failed to mark transactions as removed",
      500,
      error,
    );
  }

  console.info(
    `Marked ${transactionIds.length} transactions as removed`,
  );
};



/**
 * Deletes transactions from the database by their IDs.
 *
 * @param transactionIds - Array of transaction IDs to delete.
 * @returns Supabase delete response.
 */
export async function deleteTransactions(transactionIds: string[]) {
    return supabase.from("transactions").delete().in("transaction_id", transactionIds);
}
