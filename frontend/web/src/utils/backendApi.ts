import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import supabase from "./supabaseClient";

export const backendApi = createApi({
    reducerPath: "backendApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:4000",
        prepareHeaders: async (headers) => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session?.access_token) {
                    headers.set("Authorization", session.access_token);
                }
            } catch (err) {
                console.warn("No session available");
            }
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    endpoints: (builder) => ({
        // TODO: split into plaidApi and moneyMapApi
        createLinkToken: builder.mutation<any, void>({
            query: () => ({
                url: "/plaid/create_link_token",
                method: "POST",
            }),
        }),
        exchangePublicToken: builder.mutation({
            query: ({ public_token }) => ({
                url: "/plaid/exchange_public_token",
                method: "POST",
                body: { public_token },
            }),
        }),

        // TODO: add all types of database queries and edits
    }),
});

export const { useCreateLinkTokenMutation, useExchangePublicTokenMutation } = backendApi;
