import type { TransactionFilters } from "@shared/types/transaction.types";
import { useState, useEffect } from "react";
import { useGetTransactionsQuery } from "../utils/transactionsApi";
import styles from "./TransactionList.module.css";
import { useGetAccountsQuery, useGetInstitutionsQuery } from "../utils/userApi";

type TransactionListProps = {
    filters?: TransactionFilters;
    pageSize?: number;
};

export const TransactionList: React.FC<TransactionListProps> = ({ filters, pageSize = 20 }) => {
    const [page, setPage] = useState(1);

    // TODO: try out infinite scroll

    // TODO: this is bad, just use a join on the request instead and do the lookup in SQL
    const { data: accounts, isLoading: isAccountsLoading } = useGetAccountsQuery();
    const { data: institutions, isLoading: isInstitutionsLoading } = useGetInstitutionsQuery();

    const { data, isFetching, isLoading } = useGetTransactionsQuery({
        page,
        limit: pageSize,
        filters,
    });

    const transactions = data?.transactions ?? [];
    const hasMore = page !== data?.totalPages;

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filters]);

    if (isLoading || isAccountsLoading || isInstitutionsLoading) return <div>Loading...</div>;

    // TODO: move to utils
    const getAccountNameByid = (accountId: string) => {
        if (!accounts) return accountId;
        const account = accounts.find((a) => a.account_id === accountId);
        return account.official_name;
    };

    const getBankNameByItemId = (itemId: string) => {
        const bank = institutions?.find((institution) => institution.item_id === itemId);
        return bank.institution_name;
    };

    return (
        <div className={styles.container}>
            {/* Scrollable table body */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            <th className={styles.th}>Date</th>
                            <th className={styles.th}>Merchant</th>
                            <th className={styles.th}>Name</th>
                            <th className={styles.th}>Bank</th>
                            <th className={styles.th}>Account</th>
                            <th className={styles.th}>Category</th>
                            <th className={styles.th}>Subcategory</th>
                            <th className={styles.th}>Payment Channel</th>
                            <th className={`${styles.th} ${styles.thRight}`}>Amount</th>
                            <th className={styles.th}>Pending</th>
                            <th className={styles.th}>Notes</th>
                        </tr>
                    </thead>
                    <tbody className={styles.tbody}>
                        {transactions.map((tx) => (
                            <tr key={tx.id} className={styles.trHover}>
                                <td className={styles.td}>{new Date(tx.date).toLocaleDateString()}</td>
                                <td className={styles.td}>{tx.merchant_name || "-"}</td>
                                <td className={styles.td}>{tx.name || "-"}</td>
                                <td className={styles.td}>{getBankNameByItemId(tx.item_id)}</td>
                                <td className={styles.td}>{getAccountNameByid(tx.account_id)}</td>
                                <td className={styles.td}>{tx.category || "-"}</td>
                                <td className={styles.td}>{tx.subcategory || "-"}</td>
                                <td className={styles.td}>{tx.payment_channel || "-"}</td>
                                <td className={`${styles.td} ${styles.tdRight}`}>{tx.amount.toFixed(2)}</td>
                                <td className={styles.td}>{tx.pending ? "Yes" : "No"}</td>
                                <td className={styles.td}>{tx.notes || "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination / navigation below table */}
            <div className={styles.pagination}>
                <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1 || isFetching} className={`${styles.button} ${page === 1 || isFetching ? styles.buttonDisabled : ""}`}>
                    Previous
                </button>
                <span>Page {page}</span>
                <button onClick={() => hasMore && setPage((p) => p + 1)} disabled={!hasMore || isFetching} className={`${styles.button} ${!hasMore || isFetching ? styles.buttonDisabled : ""}`}>
                    Next
                </button>
            </div>

            {isLoading && <div className='p-4 text-center text-gray-500'>Loading first page...</div>}
            {isFetching && !isLoading && <div className='p-4 text-center text-gray-500'>Loading...</div>}
        </div>
    );
};
