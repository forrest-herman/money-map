import { backendApi } from "./backendApi";

export const plaidApi = backendApi.injectEndpoints({
    endpoints: (builder) => ({
        createLinkToken: builder.mutation<any, { accessToken?: string }>({
            query: ({ accessToken }) => ({
                url: "/plaid/create_link_token",
                method: "POST",
                // When access token is provided, link is in update mode
                body: accessToken ? { access_token: accessToken } : {},
            }),
        }),
        exchangePublicToken: builder.mutation<any, { public_token: string }>({
            query: ({ public_token }) => ({
                url: "/plaid/exchange_public_token",
                method: "POST",
                body: { public_token },
            }),
            invalidatesTags: ["Institution", "Account"],
        }),
        syncTransactions: builder.mutation<any, void>({
            query: () => ({
                url: "/plaid/transactions/sync",
                method: "POST",
            }),
            invalidatesTags: ["Institution", "Account", "Transaction"],
            // TODO: only invalite transactions for that account / institution
        }),
    }),
});

export const { useCreateLinkTokenMutation, useExchangePublicTokenMutation, useSyncTransactionsMutation } = plaidApi;
