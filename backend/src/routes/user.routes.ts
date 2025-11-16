import express from "express";
import { getInstitutions, upsertInstitution } from "../control/user.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/institutions", authMiddleware, getInstitutions);
router.post("/institutions", authMiddleware, upsertInstitution);
// router.get("/categories");

export default router;
