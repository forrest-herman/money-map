export type GetInsightsArgs = {
    /** Format YYYY-MM-DD */
    from: string;
    /** Format YYYY-MM-DD */
    to: string;
    interval: InsightInterval;
    userId: string;
};

/**
 * Allowed intervals for aggregations.
 */
export type InsightInterval = "daily" | "weekly" | "monthly" | "yearly";

/**
 * Subcategory totals within a category.
 */
export type SubcategoryTotals = Record<string, number>;

/**
 * Category totals, including subcategory drill-down.
 */
export type CategoryTotals = {
    /** Total amount within this category. */
    total: number;

    /** Totals per subcategory. */
    subcategory_totals: SubcategoryTotals;

    /** Optional merchant drill-down. */
    merchant_totals?: Record<string, number>;
};

/**
 * A single interval group, such as a week ("2025-W01") or month ("2025-01").
 */
export type InsightGroup = {
    /** A unique key for this interval. */
    interval_key: string;

    /** Total amount for this interval. */
    total: number;

    /** Totals per category. */
    category_totals: Record<string, CategoryTotals>;
};

/**
 * Full response shape of the insights endpoint.
 */
export type InsightResponse = {
    interval: InsightInterval;
    from: string;
    to: string;
    groups: InsightGroup[];
};
