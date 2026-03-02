CREATE TABLE "google_reviews" (
	"id" varchar PRIMARY KEY NOT NULL,
	"reviewer_name" varchar(255) NOT NULL,
	"review_text" text NOT NULL,
	"stars" integer DEFAULT 5 NOT NULL,
	"language" varchar(2) NOT NULL,
	"profile_picture" varchar(500),
	"review_link" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "dietaryRestrictions" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "dni" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "emergencyContact" SET DATA TYPE varchar(100);