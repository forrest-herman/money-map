import type { PaginatedTransactionsResponse, TransactionFilters } from "@shared/types/transaction.types";
import { backendApi } from "./backendApi";
import { buildQueryString } from "./utils";

export type GetTransactionsArgs = {
    page?: number;
    limit?: number;
    filters?: TransactionFilters;
};

export const transactionsApi = backendApi.injectEndpoints({
    endpoints: (builder) => ({
        getTransactions: builder.query<PaginatedTransactionsResponse, GetTransactionsArgs>({
            query: ({ page = 1, limit = 50, filters = {} }) => ({
                url: `/transactions${buildQueryString({ page, limit, ...filters })}`,
                method: "GET",
            }),
        }),
    }),
});

export const { useGetTransactionsQuery } = transactionsApi;
