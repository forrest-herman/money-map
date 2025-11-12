import { configureStore } from "@reduxjs/toolkit";
import { supabaseApi } from "./utils/supabaseApi";
import { backendApi } from "./utils/backendApi";

export const store = configureStore({
    reducer: {
        [supabaseApi.reducerPath]: supabaseApi.reducer,
        [backendApi.reducerPath]: backendApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(supabaseApi.middleware).concat(backendApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
