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
    items: any[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
};
