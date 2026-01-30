ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "contact_address" varchar(500);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(50);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "contact_email" varchar(255);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "map_lat" varchar(50);
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "map_lng" varchar(50);
