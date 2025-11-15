import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import plaidRoutes from "./routes/plaidRoutes";
import userRoutes from "./routes/institution.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/plaid", plaidRoutes);
app.use("/user", userRoutes);

// TODO: add logging middleware

app.use(errorHandler);

app.get("/", (_req, res) => {
    res.send("Backend is running 🚀");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
