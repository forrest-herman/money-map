/**
 *  - [ ]  Account totals
    - [ ]  total montly expenses (last X months)
    - [ ]  total monthly income (last X months)
    - [ ]  net worth (over time?)
 */

import { InsightInterval, InsightResponse } from "@shared/types/insights.types";
import { NextFunction, Request, Response } from "express";
import { getUserInsights } from "../services/insights.service";

/**
 * Express route handler that retrieves user insights over a specified date interval.
 *
 * Expected query parameters:
 * - `interval` (optional): The insight grouping interval (`"daily" | "weekly" | "monthly"`).
 * - `from` (required): Start date (ISO string).
 * - `to` (required): End date (ISO string).
 * - `type` (optional): Reserved for future insight filtering.
 * - `accountId` (optional): Reserved for future account-level filtering.
 *
 * Validates date range and delegates to `getUserInsights` to compute insight groups.
 *
 * Responds with an `InsightResponse` object containing:
 * - `interval`: The selected interval.
 * - `from`: Start date.
 * - `to`: End date.
 * - `groups`: Computed insight groups from the database/service layer.
 * 
 * Errors:
 * - 400 if `from` or `to` is missing.
 * - 400 if `from` is later than `to`.
 * - Passes any internal error to Express' `next()` error handler.
 * 
 * @returns Sends a JSON `InsightResponse` on success.
 */
export const handleGetInsights = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            interval = "weekly",
            from,
            to,
            type,
            accountId,
        } = req.query as {
            interval: InsightInterval;
            from: string;
            to: string;
            type?: string;
            accountId?: string;
        };

        if (!from || !to) return res.status(400).json({ error: "`from` and `to` are required" });
        if (from > to) return res.status(400).json({ error: "`from` date must be earlier than `to` date" });

        const data = await getUserInsights({ interval, from, to });

        const response: InsightResponse = {
            interval,
            from,
            to,
            groups: data,
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        next(error);
    }
};
