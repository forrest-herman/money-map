import express from "express";
import { getUserTransactions } from "../control/transaction.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("", authMiddleware, getUserTransactions);

// router.post("", saveUserTransaction);
// router.del("", deleteUserTransaction);

export default router;
