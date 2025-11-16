import { backendApi } from "./backendApi";

export const plaidApi = backendApi.injectEndpoints({
    endpoints: (builder) => ({
        createLinkToken: builder.mutation<any, void>({
            query: () => ({
                url: "/plaid/create_link_token",
                method: "POST",
            }),
        }),
        exchangePublicToken: builder.mutation<any, { public_token: string }>({
            query: ({ public_token }) => ({
                url: "/plaid/exchange_public_token",
                method: "POST",
                body: { public_token },
            }),
        }),
    }),
});

export const { useCreateLinkTokenMutation, useExchangePublicTokenMutation } = plaidApi;
