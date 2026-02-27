CREATE TABLE "google_reviews" (
	"id" varchar PRIMARY KEY NOT NULL,
	"reviewer_name" varchar(255) NOT NULL,
	"profile_picture" varchar(500),
	"review_text" text NOT NULL,
	"stars" integer NOT NULL,
	"is_active" boolean NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "dietaryRestrictions" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "dni" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "emergencyContact" SET DATA TYPE varchar(100);