CREATE TYPE "public"."achievements_badges" AS ENUM('Mountain Climber', 'Culture Explorer', 'Nature Lover', 'Leader');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY NOT NULL,
	"points" integer NOT NULL,
	"progress" integer NOT NULL,
	"level" varchar(255) NOT NULL,
	"badges" "achievements_badges" NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"trip_id" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;