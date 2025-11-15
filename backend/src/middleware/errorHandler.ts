import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
    console.error(err);

    res.status(err.statusCode || 500).json({
        error: true,
        message: err.message,
        ...(err.context ? { context: err.context } : {}),
    });
}
