import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";

export const getUserTransactions = async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user.id;
    res.json({ message: "work in progress", user: userId });
};
