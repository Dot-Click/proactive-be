import { db } from "./src/db/db";
import { sql } from "drizzle-orm";

async function check() {
    try {
        console.log("Checking DB connection...");
        const result = await db.execute(sql`SELECT version()`);
        console.log("DB version:", result[0]);
        process.exit(0);
    } catch (err) {
        console.error("DB connection error:", err);
        process.exit(1);
    }
}

check();
