import { database } from "@/configs/connection.config";
import { sql } from "drizzle-orm";

const fix = async () => {
    try {
        const db = await database(false);
        console.log("Fixing schema...");

        // 1. Create enum if not exists
        try {
            // Postgres doesn't support IF NOT EXISTS for CREATE TYPE directly in standard SQL without DO block
            await db.execute(sql`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
                        CREATE TYPE "user_status" AS ENUM ('active', 'inactive');
                    END IF;
                END $$;
            `);
            console.log("Enum 'user_status' ensured.");
        } catch (e) {
            console.error("Error creating enum:", e);
        }

        // 2. Add column
        try {
            await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "userStatus" "user_status" DEFAULT 'active' NOT NULL;`);
            console.log("Column 'userStatus' added to 'users'.");
        } catch (e) {
             console.error("Error adding column:", e);
        }
        
        console.log("Schema fix completed.");
    } catch (e) {
        console.error("Script failed:", e);
    }
    process.exit(0);
};

fix();
