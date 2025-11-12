import express from "express";
import { plaidClient } from "./plaidClient";
import { supabase } from "../supabaseClient";
import { CountryCode, Products } from "plaid";

const router = express.Router();

// 1️⃣ Create a Link Token
router.post("/create_link_token", async (req, res) => {
    try {
        // Verify user
        const { authorization } = req.headers; // JWT
        const {
            data: { user },
        } = await supabase.auth.getUser(authorization);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const response = await plaidClient.linkTokenCreate({
            user: { client_user_id: user.id },
            client_name: "Money Map",
            products: [Products.Transactions],
            country_codes: [CountryCode.Ca, CountryCode.Us],
            language: "en",
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creating link token" });
    }
});

// 2️⃣ Exchange Public Token → Access Token
/**
 * NOTE: You must use Plaid's front end login service to generate the necessary public_token.
 */
router.post("/exchange_public_token", async (req, res) => {
    try {
        // Verify user
        const { authorization } = req.headers;
        const {
            data: { user },
        } = await supabase.auth.getUser(authorization);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const { public_token } = req.body;
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // Save to Supabase
        const { data, error } = await supabase.from("plaid_items").insert({
            user_id: user.id,
            access_token: accessToken,
            item_id: itemId,
        });
        if (error) {
            return res.status(500).json({ error: "Error saving Access Token to database, please try again.", data: error });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error exchanging token", data: error });
    }
});

// 3️⃣ Fetch Transactions
router.post("/transactions", async (req, res) => {
    try {
        const { userId } = req.body;
        const { data: links } = await supabase.from("plaid_items").select("access_token").eq("user_id", userId);

        if (!links || links.length === 0) return res.json({ transactions: [] });

        // TODO: fix this up to allow date range, or all time?
        /**
         * All-time history: Depends on the financial institution
         * Some banks let Plaid fetch many years back, some only a few months
         * Plaid will return as much history as the institution supports, up to 90 days per request
         * Best practice: fetch in chunks of 90 days until you reach the earliest transaction
         */

        const accessToken = links[0].access_token;
        const now = new Date().toISOString().split("T")[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const transactionsResponse = await plaidClient.transactionsGet({
            access_token: accessToken,
            start_date: thirtyDaysAgo,
            end_date: now,
        });

        const transactions = transactionsResponse.data.transactions;

        // Optionally insert into Supabase
        await supabase.from("transactions").upsert(
            transactions.map((t) => ({
                transaction_id: t.transaction_id,
                name: t.name,
                amount: t.amount,
                date: t.date,
            }))
        );

        res.json({ transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching transactions" });
    }
});

// TODO: add transactions sync

export default router;
