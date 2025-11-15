import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/config/supabaseClient";
import { AuthenticatedRequest } from "../types/auth";

/**
 * Express middleware that authenticates requests using a Supabase JWT.
 *
 * Extracts the `Authorization` header, verifies the token using
 * `supabase.auth.getUser()`, and attaches the authenticated user
 * to `req.user` for downstream handlers.
 *
 * If the token is missing or invalid, responds with `401 Unauthorized`.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) return res.status(401).json({ error: "Missing authorization header" });

        const token = authorization;

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) return res.status(401).json({ error: "Unauthorized", context: error });

        // Attach user to request object for downstream handlers
        (req as AuthenticatedRequest).user = user;

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(401).json({ error: "Unauthorized" });
    }
};
