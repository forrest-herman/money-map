export type TransactionType = "purchase" | "income" | "transfer" | "investment";

/**
 * Represents a financial transaction from a Plaid-linked account.
 */
export interface Transaction {
    /** Primary key (identity / auto-increment) */
    id?: number;
    /** Timestamp when the row was created */
    created_at?: string;
    /** Timestamp when the row was last updated */
    updated_at: string | null;
    /** User who owns this transaction (FK → auth.users.id) */
    user_id: string | null;
    /** Unique Plaid transaction ID */
    transaction_id: string | null;
    /** Plaid account ID (FK → accounts.account_id) */
    account_id: string | null;
    /** Transaction amount (positive or negative) */
    amount: number | null;
    /** Merchant name provided by Plaid */
    merchant_name?: string | null;
    /** Transaction name / primary description from Plaid */
    name: string | null;
    /** Posting date of the transaction */
    date: string;
    /** ISO currency code (e.g., "USD") */
    iso_currency_code?: string | null;
    /** Location data (raw string from Plaid metadata) */
    location: string | null;
    /** Payment channel (e.g., "online", "in store") */
    payment_channel: string | null;
    /** Whether the transaction is still pending */
    pending: boolean;
    /** User-assigned or Plaid-assigned category */
    category: string | null;
    /** More specific category */
    subcategory: string | null;
    /** Free-form notes entered by the user */
    notes?: string;
    /** Raw metadata returned by Plaid */
    plaid_metadata: Record<string, any> | null; // TODO: this is a Plaid Transaction type, need to access import
    /** Plaid item ID (FK → linked_institutions.item_id) */
    item_id: string | null;
    /** Transaction type (Plaid-defined or user-defined) */
    type: TransactionType | null;
    /** Identify if the transaction has been deleted. */
    is_removed?: boolean | null;
    /** Replaced transaction_id if this is a posted transaction. */
    pending_transaction_id?: string | null;
}

export type TransactionFilters = {
    accountId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    category?: string;
    search?: string;
};

export type PaginationParams = {
    page?: number;
    pageSize?: number;
};

export type PaginatedTransactionsResponse = {
    transactions: any[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
};
