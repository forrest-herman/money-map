import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { getTransactions } from "../services/transaction.service";
import { TransactionFilters } from "@shared/types/transaction.types";

export const getUserTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;

        // Extract filters
        const filters: TransactionFilters = {
            search: (req.query.search as string) || undefined,
            accountId: (req.query.accountId as string) || undefined,
            category: (req.query.category as string) || undefined,
            minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
            maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
            startDate: (req.query.startDate as string) || undefined,
            endDate: (req.query.endDate as string) || undefined,
        };

        // Extract pagination
        const page = parseInt(req.query.page as string) || undefined;
        const limit = parseInt(req.query.limit as string) || undefined;
        const pagination = { page, limit };

        const result = await getTransactions(userId, filters, pagination);

        res.json(result);
    } catch (error) {
        next(error);
    }
};
