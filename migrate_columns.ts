import { Pool } from 'pg';
import { env } from './src/utils/env.utils';

const pool = new Pool({
  connectionString: env.CONNECTION_URL,
});

async function run() {
  try {
    await pool.query('ALTER TABLE trips ADD COLUMN application_type text DEFAULT \'video\';');
    console.log('application_type added');
  } catch (e: any) { console.log(e.message) }

  try {
    await pool.query('ALTER TABLE trips ADD COLUMN deposit_amount text;');
    console.log('deposit_amount added');
  } catch (e: any) { console.log(e.message) }
  
  process.exit(0);
}
run();
