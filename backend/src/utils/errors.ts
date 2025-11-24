/**
 * Represents an operational application error with an attached HTTP status code
 * and optional context payload for debugging or logging.
 *
 * @example
 * throw new AppError("User not found", 404, { userId });
 */
export class AppError extends Error {
    public statusCode: number;
    public context?: any;
    public isOperational: boolean;

    constructor(message: string, statusCode = 500, context?: any, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.context = context;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class PlaidItemLoginRequiredError extends AppError {
    constructor(message = "Item login required", statusCode = 409) {
        super(message);
        this.name = "PlaidItemLoginRequiredError";
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, PlaidItemLoginRequiredError.prototype);
    }
}

export class ItemAlreadyExistsError extends Error {
    constructor(message = "Item already exists") {
        super(message);
        this.name = "ItemAlreadyExistsError";
    }
}
