import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

/**
 * Global Express error-handling middleware.
 *
 * This middleware catches any errors passed via `next(err)` or thrown inside
 * async route handlers. It formats the error into a consistent JSON response
 * and ensures the client never receives an HTML error page.
 *
 * The presence of the fourth parameter (`next`) is required so Express can
 * recognize this function as an error handler, even if `next` is not used.
 *
 * @param {AppError} err - The error object thrown or passed to `next()`.
 *   Should contain:
 *     - `message` {string} A human-readable error message.
 *     - `statusCode` {number} Optional HTTP status code.
 *     - `context` {object} Optional additional metadata for debugging.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - Required by Express to identify this as an error handler.
 *
 * @returns {void} Sends a JSON error response with appropriate status code.
 */
export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
    console.error(err);

    res.status(err.statusCode || 500).json({
        error: true,
        message: err.message,
        ...(err.context ? { context: err.context } : {}),
    });
}
