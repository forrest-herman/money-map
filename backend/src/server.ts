import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import plaidRoutes from "./routes/plaid.routes";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middleware/errorHandler";
import transactionRoutes from "./routes/transaction.routes";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/plaid", plaidRoutes);
app.use("/user", userRoutes);
app.use("/transactions", transactionRoutes);

// TODO: add logging middleware

app.use(errorHandler);

app.get("/", (_req, res) => {
    res.send("Backend is running 🚀");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
