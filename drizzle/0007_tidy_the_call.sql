CREATE TYPE "public"."trip_approval_status" AS ENUM('pending', 'approved', 'unpublished', 'rejected');--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."trip_status";--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('pending', 'active', 'completed', 'open', 'live');--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."trip_status";--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "status" SET DATA TYPE "public"."trip_status" USING "status"::"public"."trip_status";--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "approval_status" "trip_approval_status" DEFAULT 'pending' NOT NULL;