CREATE TABLE "trip_coordinators" (
	"id" varchar PRIMARY KEY NOT NULL,
	"trip_id" varchar(128) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "trip_coordinators" ADD CONSTRAINT "trip_coordinators_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_coordinators" ADD CONSTRAINT "trip_coordinators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;