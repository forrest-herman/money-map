/**
 * Represents a linked financial institution for a user.
 * Each institution corresponds to one Plaid item.
 */
export interface Institution {
    /** Primary key (identity / auto-increment) */
    id?: number;
    /** Timestamp when the row was created */
    created_at?: string;
    /** User who linked the institution (FK → auth.users.id) */
    user_id: string;
    /** Encrypted Plaid access token */
    access_token: string;
    /** Unique Plaid item ID */
    item_id: string;
    /** Institution display name from Plaid */
    institution_name: string | null;
    /** Institution ID from Plaid */
    institution_id: string | null;
    /** Plaid sync cursor for incremental transaction sync */
    cursor?: string | null;
}
