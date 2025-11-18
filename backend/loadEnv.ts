import dotenv from "dotenv";
import path from "path";
dotenv.config();
if (process.env.NODE_DEV_ENV) dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

console.log("NODE_DEV_ENV Environment loaded:", process.env.NODE_DEV_ENV);
