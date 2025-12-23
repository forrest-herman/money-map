import { Account } from "@shared/types/account.types";
import { Transaction, TransactionType } from "@shared/types/transaction.types";
import type { AccountBase, Transaction as PlaidTransaction, RemovedTransaction } from "plaid";

/**
 * Classifies a Plaid transaction into a simplified transaction type.
 *
 * The classification is based on the transaction amount and Plaid's
 * `personal_finance_category.primary` value.
 *
 * Rules:
 * - Transfers (`TRANSFER_OUT`, `TRANSFER_IN`, `LOAN_PAYMENTS`) → `"transfer"`
 * - Positive‐amount income transactions (`INCOME`) → `"income"`
 * - Everything else (including purchases and refunds) → `"purchase"`
 *
 */
export const classifyTransaction = (tx: any): TransactionType => {
    const amt = -1 * tx.amount; // Plaid is backwards
    const pfc = tx.personal_finance_category?.primary;

    const isTransferCategory = pfc === "TRANSFER_OUT" || pfc === "TRANSFER_IN" || pfc === "LOAN_PAYMENTS";
    const isIncomeCategory = pfc === "INCOME";

    if (isTransferCategory) return "transfer";

    if (amt > 0 && isIncomeCategory) return "income";

    // PURCHASE (including refunds)
    return "purchase";
};

/**
 * Maps a Plaid AccountBase object into the internal account schema
 * used in the database.

* @returns Mapped account object ready for database upsert.
 */
export const mapPlaidAccount = (
    /** Plaid account object. */
    a: AccountBase,
    /** User ID. */
    userId: string,
    /** Plaid item ID the account belongs to. */
    itemId: string
): Account => {
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

/**
 * Maps a Plaid Transaction object into the internal transaction schema
 * used in the database.
 *
 * @returns Mapped transaction ready for database upsert.
 * // TODO: make response the CustomTransaction type
 */
export const mapPlaidTransaction = (
    /** Plaid transaction object. */
    t: PlaidTransaction,
    /** User ID. */
    userId: string,
    /** Plaid item ID the transaction belongs to. */
    itemId: string
): Transaction => {
    return {
        transaction_id: t.transaction_id,
        user_id: userId,
        item_id: itemId,
        account_id: t.account_id,
        merchant_name: t.merchant_name,
        name: t.name,
        amount: t.amount * -1, // Plaid is backwards
        date: t.date,
        iso_currency_code: t.iso_currency_code,
        location: t.location.city ? `${t.location.city}, ${t.location.region}` : null,
        payment_channel: t.payment_channel,
        pending: t.pending,
        category: t.personal_finance_category?.primary ?? null,
        subcategory: t.personal_finance_category?.detailed ?? null,
        plaid_metadata: t,
        type: classifyTransaction(t),
        updated_at: new Date().toISOString(),
    };
};