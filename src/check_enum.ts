import { database } from "./configs/connection.config";
import { sql } from "drizzle-orm";

async function check() {
  const db = await database();
  const res = await db.execute(sql`
    SELECT enumlabel 
    FROM pg_enum 
    WHERE enumtypid = 'trip_status'::regtype
  `);
  console.log('Enum labels in trip_status:', JSON.stringify(res, null, 2));
}

check();
