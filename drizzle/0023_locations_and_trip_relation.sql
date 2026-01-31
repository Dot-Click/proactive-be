-- Create locations table
CREATE TABLE IF NOT EXISTS "locations" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL UNIQUE,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
-- Add location_id to trips (nullable first for backfill)
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "location_id" varchar(128);
--> statement-breakpoint
-- Backfill: insert distinct trip locations (id = md5 of name for uniqueness)
INSERT INTO "locations" ("id", "name", "createdAt", "updatedAt")
SELECT md5("location")::varchar(32), "location", now(), now()
FROM (SELECT DISTINCT "location" FROM "trips" WHERE "location" IS NOT NULL AND trim("location") != '') t
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Update trips to set location_id from locations table
UPDATE "trips" t
SET "location_id" = l."id"
FROM "locations" l
WHERE l."name" = t."location" AND t."location_id" IS NULL;
--> statement-breakpoint
-- For any trip that still has null location_id (e.g. empty string), insert a default location and set it
INSERT INTO "locations" ("id", "name", "createdAt", "updatedAt")
VALUES (substring(md5('Unknown') from 1 for 25), 'Unknown', now(), now())
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
UPDATE "trips" SET "location_id" = (SELECT "id" FROM "locations" WHERE "name" = 'Unknown' LIMIT 1) WHERE "location_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "trips" DROP COLUMN IF EXISTS "location";
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;
