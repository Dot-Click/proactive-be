-- Add dynamic content fields to trips table
ALTER TABLE "trips" 
ADD COLUMN "highlights" jsonb,
ADD COLUMN "mood" jsonb,
ADD COLUMN "common_fund" text,
ADD COLUMN "common_fund_description" text,
ADD COLUMN "common_fund_count" integer,
ADD COLUMN "things_to_know" jsonb;
