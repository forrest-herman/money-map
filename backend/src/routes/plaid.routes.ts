import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { connectPlaid, createLinkToken, handleWebhook, syncTransactions } from "../control/plaid.controller";

const router = express.Router();

router.post("/create_link_token", authMiddleware, createLinkToken);
router.post("/exchange_public_token", authMiddleware, connectPlaid);
router.post("/transactions/sync", authMiddleware, syncTransactions);

router.post("/webhook", handleWebhook);

export default router;
