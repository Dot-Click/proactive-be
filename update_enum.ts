import { Pool } from 'pg';
import { env } from './src/utils/env.utils';

const pool = new Pool({
  connectionString: env.CONNECTION_URL,
});

async function run() {
  try {
    // Add value 'coming soon' to the trip_status enum in PostgreSQL
    await pool.query("ALTER TYPE trip_status ADD VALUE 'coming soon';");
    console.log('Value "coming soon" added to trip_status enum');
  } catch (e: any) {
    if (e.message.includes('already exists')) {
      console.log('Value "coming soon" already exists');
    } else {
      console.log('Error adding value:', e.message);
    }
  }
  
  process.exit(0);
}
run();
