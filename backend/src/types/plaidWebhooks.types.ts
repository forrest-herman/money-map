export type PlaidWebhookType =
    | "AUTH"
    | "HOLDINGS"
    | "ITEM"
    | "INVESTMENTS_TRANSACTIONS"
    | "LIABILITIES"
    | "TRANSACTIONS"
    | "INCOME"
    | "PAYMENTS"
    | "TRANSFER"
    | "WALLET"
    | "STATEMENTS"
    | "EMPLOYMENT"
    | "CREDIT";

/** Base shape included in all webhook payloads */
export interface PlaidWebhookBase {
    webhook_type: PlaidWebhookType;
    webhook_code: string; // refined below via discriminated unions
    item_id: string;
}

type TransactionsWebhookCode = "INITIAL_UPDATE" | "HISTORICAL_UPDATE" | "DEFAULT_UPDATE" | "TRANSACTIONS_REMOVED" | "SYNC_UPDATES_AVAILABLE";

interface TransactionsInitialUpdateWebhook extends PlaidWebhookBase {
    webhook_type: "TRANSACTIONS";
    webhook_code: "INITIAL_UPDATE";
    new_transactions: number;
}

interface TransactionsHistoricalUpdateWebhook extends PlaidWebhookBase {
    webhook_type: "TRANSACTIONS";
    webhook_code: "HISTORICAL_UPDATE";
    new_transactions: number;
}

type PlaidTransactionsWebhook = TransactionsInitialUpdateWebhook | TransactionsHistoricalUpdateWebhook;

export type PlaidWebhook = PlaidTransactionsWebhook;
