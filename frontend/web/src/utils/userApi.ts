import { backendApi } from "./backendApi";

export const userApi = backendApi.injectEndpoints({
    endpoints: (builder) => ({
        getInstitutions: builder.query<any[], void>({
            query: () => "/user/institutions",
            providesTags: ["Institution"],
        }),
        getAccounts: builder.query<any[], void>({
            query: () => "/user/accounts",
            providesTags: ["Account"],
        }),
    }),
});

export const { useGetInstitutionsQuery, useGetAccountsQuery } = userApi;
