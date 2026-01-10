ALTER TABLE "users" ADD COLUMN "provider" varchar(20) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" varchar(255);