import { database } from "@/configs/connection.config";
import { sql } from "drizzle-orm";

const check = async () => {
    try {
        const db = await database(false);
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'userStatus';
        `);
        console.log("Check userStatus column:");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

check();
