ALTER TABLE "trips" ADD COLUMN "category_id" varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");