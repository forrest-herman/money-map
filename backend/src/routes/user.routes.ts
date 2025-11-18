import express from "express";
import { getInstitutions, handleGetAccounts, upsertInstitution } from "../control/user.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/institutions", authMiddleware, getInstitutions);
router.post("/institutions", authMiddleware, upsertInstitution);

router.get("/accounts", authMiddleware, handleGetAccounts);

// router.get("/categories");

export default router;
