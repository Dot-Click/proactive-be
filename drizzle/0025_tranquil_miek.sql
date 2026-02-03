CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "banner" (
	"id" varchar PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "banner" varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "contact_address" varchar(500);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "contact_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "map_lat" varchar(50);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "map_lng" varchar(50);--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "location_id" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "userStatus" "user_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" DROP COLUMN "location";