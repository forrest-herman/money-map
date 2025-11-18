import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { handleGetInsights } from "../control/insights.controller";

const router = express.Router();

router.get("", authMiddleware, handleGetInsights);

export default router;
