const { Client } = require('pg');

const connectionString = "postgresql://postgres.lotdbmfkjrgzmaqhvjgj:lunDofs6mxUKerKy@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const sql = `
ALTER TABLE "trips" 
ADD COLUMN IF NOT EXISTS "highlights" jsonb,
ADD COLUMN IF NOT EXISTS "mood" jsonb,
ADD COLUMN IF NOT EXISTS "common_fund" text,
ADD COLUMN IF NOT EXISTS "common_fund_description" text,
ADD COLUMN IF NOT EXISTS "common_fund_count" integer,
ADD COLUMN IF NOT EXISTS "things_to_know" jsonb;
`;

async function applyMigration() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    await client.query(sql);
    console.log('✓ Migration applied successfully!');
    
    await client.end();
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
