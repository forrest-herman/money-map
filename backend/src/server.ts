import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import plaidRoutes from "./plaid/routes";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount Plaid routes
app.use("/plaid", plaidRoutes);

app.get("/", (_req, res) => {
    res.send("Backend is running 🚀");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
