import { AppError } from "../utils/errors";
import { supabase } from "./config/supabaseClient";
import { GetInsightsArgs, InsightInterval } from "@shared/types/insights.types";

type RpcInterval = "day" | "week" | "month" | "year";

/** Map frontend interval to Postgres date_trunc interval */
const intervalMap: Record<InsightInterval, RpcInterval> = {
    daily: "day",
    weekly: "week",
    monthly: "month",
    yearly: "year",
};

/**
 * Retrieves aggregated financial insights for a user over a given date range.
 *
 * This function calls the Postgres RPC function `get_insights` via Supabase,
 * passing validated parameters such as:
 * - `from_date`: Start of the date range (ISO string)
 * - `to_date`: End of the date range (ISO string)
 * - `interval_unit`: Mapped interval ("day", "week", "month", etc.)
 *
 * The returned dataset structure depends on the SQL implementation of
 * the `get_insights` RPC, but typically contains grouped insights
 * (spending, income, transfers, etc.) keyed by the selected interval.
 *
 * Throws an `AppError` if the RPC fails.
 *
 * @returns The aggregated insight data returned by the RPC.
 *           The shape depends on your `get_insights` SQL function.
 *
 * @example
 * const insights = await getUserInsights({
 *   interval: "weekly",
 *   from: "2025-01-01",
 *   to: "2025-01-31",
 *   input_user_id: "aetewtoiskdgg3ijdsogi"
 * });
 */
export const getUserInsights = async (params: GetInsightsArgs) => {
    const interval = intervalMap[params.interval];

    const { data, error } = await supabase.rpc("get_insights", {
        from_date: params.from,
        to_date: params.to,
        interval_unit: interval,
        input_user_id: params.userId,
    });
    if (error) throw new AppError("Failed to get user insights", 500, error);

    return data;
};
