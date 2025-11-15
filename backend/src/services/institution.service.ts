import { Item } from "plaid";
import { AppError } from "../utils/errors";
import { supabase } from "./config/supabaseClient";

/**
 * Fetches all linked institutions for a given user.
 *
 * @param userId - The ID of the user whose institutions to fetch.
 * @returns Array of institution records or undefined if none found.
 */
export const getInstitutionsByUser = async (userId: string) => {
    const { data, error } = await supabase
        .from("linked_institutions")
        .select("*") // select all columns
        .eq("user_id", userId); // filter by userId

    if (error) throw new AppError(`Failed to fetch institutions for user ${userId}`, 500, error);
    else return data;
};

/**
 * Fetch a single institution by its Plaid item ID.
 *
 * @param itemId - Plaid item ID to look up.
 * @returns The institution record.
 */
export const getInstitutionByItemId = async (itemId: string) => {
    return supabase.from("linked_institutions").select("*").eq("item_id", itemId).single();
};

/**
 * Saves a Plaid institution item (access token + metadata) to the database.
 *
 * Throws `AppError` for database failures.
 *
 * @param userId - ID of the user linking the institution.
 * @param accessToken - Plaid access token.
 * @param itemData - Plaid Item object containing institution metadata.
 */
export const saveInstitutionItemToDB = async (userId: string, accessToken: string, itemData: Item) => {
    const { error } = await supabase.from("linked_institutions").upsert({
        user_id: userId,
        access_token: accessToken,
        item_id: itemData.item_id,
        institution_name: itemData.institution_name,
        institution_id: itemData.institution_id,
    });
    if (error) throw new AppError("Failed to save Plaid item", 500, error);
};

/**
 * Updates the Plaid item cursor for a given user and item.
 *
 * This is used to track transaction sync progress.
 *
 * @param userId - ID of the user.
 * @param itemId - Plaid item ID.
 * @param cursor - Optional cursor string from Plaid (null to reset).
 * @throws AppError if the database update fails.
 */
export const updateInstitutionItemCursor = async (userId: string, itemId: string, cursor?: string) => {
    const { error } = await supabase
        .from("linked_institutions")
        .update({
            cursor: cursor ?? null,
        })
        .eq("user_id", userId)
        .eq("item_id", itemId);
    if (error) throw new AppError("Failed to save Plaid item cursor update", 500, error);
};
