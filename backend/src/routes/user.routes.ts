import express from "express";
import { getInstitutions } from "../control/user.controller";

const router = express.Router();

router.get("/institutions", getInstitutions);
// TODO: post to institutions
// router.get("/categories");

// router.get("/transactions"); // TODO: move to separate route

export default router;
