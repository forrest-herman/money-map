import type { Institution } from "@shared/types/institution.types";
import { backendApi } from "./backendApi";
import type { Account } from "@shared/types/account.types";

export const userApi = backendApi.injectEndpoints({
    endpoints: (builder) => ({
        getInstitutions: builder.query<Institution[], void>({
            query: () => "/user/institutions",
            providesTags: ["Institution"],
        }),
        getAccounts: builder.query<Account[], void>({
            query: () => "/user/accounts",
            providesTags: ["Account"],
        }),
    }),
});

export const { useGetInstitutionsQuery, useGetAccountsQuery } = userApi;
