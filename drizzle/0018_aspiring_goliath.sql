ALTER TABLE "coordinator_details" ADD COLUMN "location" varchar(200);--> statement-breakpoint
ALTER TABLE "coordinator_details" ADD COLUMN "successRate" numeric;--> statement-breakpoint
ALTER TABLE "coordinator_details" ADD COLUMN "repeatCustomers" integer;--> statement-breakpoint
ALTER TABLE "coordinator_details" ADD COLUMN "totalRevenue" numeric(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastActive" varchar(30);