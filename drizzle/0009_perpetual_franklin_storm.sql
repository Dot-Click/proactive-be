CREATE TABLE "coordinator_details" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"fullName" varchar(200),
	"email" varchar(100),
	"phoneNumber" varchar(20),
	"bio" text,
	"profilePicture" varchar(255),
	"specialities" text[],
	"languages" text[],
	"certificateLvl" varchar(20),
	"yearsOfExperience" integer,
	"type" varchar(20),
	"accessLvl" varchar(20),
	"password" varchar(100),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	CONSTRAINT "coordinator_details_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "coordinator_details_id" varchar(128);--> statement-breakpoint
ALTER TABLE "coordinator_details" ADD CONSTRAINT "coordinator_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_coordinator_details_id_coordinator_details_id_fk" FOREIGN KEY ("coordinator_details_id") REFERENCES "public"."coordinator_details"("id") ON DELETE cascade ON UPDATE no action;