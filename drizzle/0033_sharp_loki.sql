ALTER TYPE "public"."trip_status" ADD VALUE 'coming soon';--> statement-breakpoint
CREATE TABLE "extra_items" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"icon" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "discount" ALTER COLUMN "trip_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "discount" ALTER COLUMN "discount_percentage" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "discount" ALTER COLUMN "discount_percentage" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "approval_status" SET DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "google_reviews_mark" numeric DEFAULT '4.9';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "google_reviews_count" integer DEFAULT 92;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "discount_id" varchar(128);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "application_type" varchar(50) DEFAULT 'video';--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "deposit_amount" varchar(100);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "rating" numeric DEFAULT '4.9';--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "reviews_count" integer DEFAULT 92;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "review_link" varchar(1500) DEFAULT 'https://www.google.com/maps/place/Proactive+Future/@35.67445,-6.8143,2933475m/data=!3m2!1e3!4b1!4m6!3m5!1s0x65e285d9dffa46ab:0x3dd1b18e867e6183!8m2!3d35.67445!4d-6.8143!16s%2Fg%2F11t6yzt6vh?entry=ttu&g_ep=EgoyMDI2MDMyOS4wIKXMDSoASAFQAw%3D%3D';--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_discount_id_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discount"("id") ON DELETE set null ON UPDATE no action;