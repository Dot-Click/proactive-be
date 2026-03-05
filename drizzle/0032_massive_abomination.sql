ALTER TABLE "trips" ADD COLUMN "highlights" jsonb;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "mood" jsonb;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "common_fund" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "common_fund_description" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "common_fund_count" integer;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "things_to_know" jsonb;