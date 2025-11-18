import "../loadEnv"; // must be first
import express from "express";
import cors from "cors";
import plaidRoutes from "./routes/plaid.routes";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middleware/errorHandler";
import transactionRoutes from "./routes/transaction.routes";
import insightsRoutes from "./routes/insights.routes";

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/status', (_req, res)=>res.status(200).send("Ok")) // check status of backend and keep alive
app.use("/plaid", plaidRoutes);
app.use("/user", userRoutes);
app.use("/transactions", transactionRoutes);
app.use("/insights", insightsRoutes);

// TODO: add logging middleware

app.use(errorHandler);

app.get("/", (_req, res) => {
    res.send("Backend is running 🚀");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
