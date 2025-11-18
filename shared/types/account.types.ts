/**
 * Represents a financial account returned from Plaid and stored in Supabase.
 */
export interface Account {
    /** Primary key (identity / auto-increment) */
    id?: number;
    /** Timestamp when the row was created (defaults to `now()`) */
    created_at?: string;
    /** Timestamp when the row was last updated */
    updated_at: string;
    /** Unique Plaid account ID */
    account_id: string;
    /** Corresponding Plaid item ID (FK → linked_institutions.item_id) */
    item_id: string;
    /** User who owns this account (FK → auth.users.id) */
    user_id: string;
    /** Plaid account type (e.g., "depository") */
    type: string | null;
    /** Plaid account subtype (e.g., "checking") */
    subtype: string | null;
    /** Official name from Plaid */
    official_name: string | null;
    /** User-friendly account name */
    name: string | null;
    /** Last 2–4 digits of account number */
    mask: string | null;
    /** Full balances object from Plaid */
    balances: Record<"limit" | "current" | "available", any> | null;
}
