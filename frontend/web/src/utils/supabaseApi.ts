import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import supabase from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";

export const supabaseApi = createApi({
    reducerPath: "supabaseApi",
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        signUp: builder.mutation({
            async queryFn({ email, password }) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) return { error };
                return { data };
            },
        }),

        signIn: builder.mutation({
            async queryFn({ email, password }) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return { error };
                return { data };
            },
        }),

        getSession: builder.query<Session | null, void>({
            async queryFn() {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    // Convert Supabase error to RTK Query error shape
                    return { error: { status: "ERROR", data: error.message } };
                }

                return { data: data.session ?? null };
            },
        }),
    }),
});

export const { useSignUpMutation, useSignInMutation, useGetSessionQuery } = supabaseApi;
