ALTER TABLE "achievements" ALTER COLUMN "points" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "unlocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "role" varchar(50);