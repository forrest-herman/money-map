import { NextFunction, Request, Response } from "express";
import { getInstitutionsByUser, saveInstitutionItemToDB } from "../services/institution.service";
import { AuthenticatedRequest } from "../types/auth";
import { getAccountsByUser } from "../services/account.service";

/**
 * Get all linked institutions for the authenticated user.
 *
 * Extracts the `user.id` from the authenticated request and returns
 * the institutions/items associated with that user.
 */
export const getInstitutions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const items = await getInstitutionsByUser(userId);
        res.json(items);
    } catch (error) {
        next(error);
    }
};

/**
 * Endpoint to upsert a Plaid institution item for the authenticated user.
 *
 * Saves the access token and item metadata into the database.
 *
 */
export const upsertInstitution = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const { item_id, access_token } = req.body;

        // await saveInstitutionItemToDB(userId, accessToken, item);
    } catch (error) {
        next(error);
    }
};

export const handleGetAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user.id;
        const accounts = await getAccountsByUser(userId);
        res.json(accounts);
    } catch (error) {
        next(error);
    }
};
