import { supabase } from "./config/supabaseClient";
import { AppError } from "../utils/errors";

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
 * Deletes transactions from the database by their IDs.
 *
 * @param transactionIds - Array of transaction IDs to delete.
 * @returns Supabase delete response.
 */
export async function deleteTransactions(transactionIds: string[]) {
    return supabase.from("transactions").delete().in("transaction_id", transactionIds);
}
