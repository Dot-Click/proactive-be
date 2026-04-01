
import postgres from "postgres";

async function migrate() {
    const url = "postgresql://postgres.lotdbmfkjrgzmaqhvjgj:lunDofs6mxUKerKy@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
    console.log("Connecting to:", url);
    const sql = postgres(url);
    try {
        console.log("Creating enum sport_level...");
        await sql`
            DO $$ BEGIN
                CREATE TYPE sport_level AS ENUM ('bajo', 'medio', 'alto');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `;
        
        console.log("Removing rhythm and updating sportLvl in trips...");
        // Check if rhythm exists
        const tableInfo = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'trips' AND column_name = 'rhythm'
        `;
        
        if (tableInfo.length > 0) {
            console.log("Dropping column rhythm...");
            await sql`ALTER TABLE trips DROP COLUMN rhythm`;
        }

        console.log("Updating sportLvl column type...");
        // This is a bit tricky if there's data, but I'll try to convert it.
        // First drop the old column (or rename it)
        await sql`ALTER TABLE trips RENAME COLUMN "sportLvl" TO "sportLvl_old"`;
        await sql`ALTER TABLE trips ADD COLUMN "sportLvl" sport_level DEFAULT 'medio' NOT NULL`;
        
        // Try to map old values to new ones
        await sql`UPDATE trips SET "sportLvl" = 'bajo' WHERE "sportLvl_old" ILIKE '%easy%' OR "sportLvl_old" ILIKE '%bajo%'`;
        await sql`UPDATE trips SET "sportLvl" = 'medio' WHERE "sportLvl_old" ILIKE '%intermediate%' OR "sportLvl_old" ILIKE '%medio%'`;
        await sql`UPDATE trips SET "sportLvl" = 'alto' WHERE "sportLvl_old" ILIKE '%advanced%' OR "sportLvl_old" ILIKE '%alto%'`;
        
        await sql`ALTER TABLE trips DROP COLUMN "sportLvl_old"`;
        
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await sql.end();
    }
}

migrate();
