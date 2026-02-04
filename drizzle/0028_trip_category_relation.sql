-- Add category_id to trips (nullable first for backfill)
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "category_id" varchar(128);
--> statement-breakpoint
-- Ensure a default "Other" category exists for any unmatched legacy types
INSERT INTO "categories" ("id", "name", "isActive", "createdAt", "updatedAt")
SELECT substring(md5('Other') from 1 for 25), 'Other', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE lower("name") = 'other');
--> statement-breakpoint
-- Backfill category_id from legacy trips.type matching categories.name (case-insensitive)
UPDATE "trips" t
SET "category_id" = c."id"
FROM "categories" c
WHERE t."category_id" IS NULL
  AND t."type" IS NOT NULL
  AND lower(trim(c."name")) = lower(trim(t."type"));
--> statement-breakpoint
-- For any trip still missing category_id, set to "Other"
UPDATE "trips"
SET "category_id" = (SELECT "id" FROM "categories" WHERE lower("name") = 'other' LIMIT 1)
WHERE "category_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "category_id" SET NOT NULL;
--> statement-breakpoint
-- Drop legacy type column now that relation exists
ALTER TABLE "trips" DROP COLUMN IF EXISTS "type";
--> statement-breakpoint
-- Add FK constraint (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trips_category_id_categories_id_fk'
  ) THEN
    ALTER TABLE "trips"
      ADD CONSTRAINT "trips_category_id_categories_id_fk"
      FOREIGN KEY ("category_id")
      REFERENCES "public"."categories"("id")
      ON DELETE restrict
      ON UPDATE no action;
  END IF;
END $$;
