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

    // 2. Add userStatus column
    try {
      await db.execute(
        sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "userStatus" "user_status" DEFAULT 'active' NOT NULL;`,
      );
      console.log("Column 'userStatus' added to 'users'.");
    } catch (e) {
      console.error("Error adding userStatus:", e);
    }

    // 3. Add dietaryRestrictions (migration 0030)
    try {
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dietaryRestrictions" varchar(200);`);
      console.log("Column 'dietaryRestrictions' added to 'users'.");
    } catch (e) {
      console.error("Error adding dietaryRestrictions:", e);
    }

    // 4. Update dietaryRestrictions column length if it exists
    try {
      await db.execute(sql`ALTER TABLE "users" ALTER COLUMN "dietaryRestrictions" TYPE varchar(200);`);
      console.log("Column 'dietaryRestrictions' length updated to 200.");
    } catch (e) {
      // Column might not exist or already be correct length
      console.log("Note: dietaryRestrictions column length update skipped (may already be correct or column doesn't exist).");
    }

    // 5. Add emergencyContact (migration 0030)
    try {
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emergencyContact" varchar(100);`);
      console.log("Column 'emergencyContact' added to 'users'.");
    } catch (e) {
      console.error("Error adding emergencyContact:", e);
    }

    // 6. Update emergencyContact column length if it exists
    try {
      await db.execute(sql`ALTER TABLE "users" ALTER COLUMN "emergencyContact" TYPE varchar(100);`);
      console.log("Column 'emergencyContact' length updated to 100.");
    } catch (e) {
      // Column might not exist or already be correct length
      console.log("Note: emergencyContact column length update skipped (may already be correct or column doesn't exist).");
    }

    // 7. Add dni (required by schema)
    try {
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dni" varchar(50);`);
      console.log("Column 'dni' added to 'users'.");
    } catch (e) {
      console.error("Error adding dni:", e);
    }

    // 8. Update dni column length if it exists
    try {
      await db.execute(sql`ALTER TABLE "users" ALTER COLUMN "dni" TYPE varchar(50);`);
      console.log("Column 'dni' length updated to 50.");
    } catch (e) {
      // Column might not exist or already be correct length
      console.log("Note: dni column length update skipped (may already be correct or column doesn't exist).");
    }

    console.log("Schema fix completed.");
  } catch (e) {
    console.error("Script failed:", e);
  }
  process.exit(0);
};

fix();
