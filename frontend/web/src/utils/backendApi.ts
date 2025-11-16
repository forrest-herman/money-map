import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import supabase from "./supabaseClient";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const backendApi = createApi({
    reducerPath: "backendApi",
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
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
    endpoints: () => ({}),
});