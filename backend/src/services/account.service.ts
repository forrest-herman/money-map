import { AppError } from "../utils/errors";
import { supabase } from "./config/supabaseClient";

/**
 * Upserts multiple account records into the database.
 *
 * Uses the `account_id` column as the conflict key for upserts.
 * Throws an `AppError` if the database operation fails.
 *
 * // TODO: Replace `any` with a proper `Account` TypeScript type.
 *
 * @param accounts - Array of account objects to insert or update.
 */
export const upsertAccountsToDB = async (accounts: any[]) => {
    const { error } = await supabase.from("accounts").upsert(accounts, { onConflict: "account_id" });
    if (error) throw new AppError("Failed to save accounts", 500, error);
};

export const getAccountsByUser = async (userId: string) => {
    const { data, error } = await supabase
        .from("accounts")
        .select("*") // select all columns
        .eq("user_id", userId); // filter by userId

    if (error) throw new AppError(`Failed to fetch accounts for user ${userId}`, 500, error);
    else return data;
};