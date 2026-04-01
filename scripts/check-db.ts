
import postgres from "postgres";

async function checkDb() {
    const url = "postgresql://postgres.lotdbmfkjrgzmaqhvjgj:lunDofs6mxUKerKy@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
    console.log("Connecting to:", url);
    const sql = postgres(url);
    try {
        const res = await sql`SELECT 1`;
        console.log("Connection successful:", res);
    } catch (e) {
        console.error("Connection failed:", e);
    } finally {
        await sql.end();
    }
}

checkDb();
