CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."discount_status" AS ENUM('active', 'inactive', 'expired', 'used');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'unpaid', 'pending', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('pending', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "Application" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"trip_id" varchar(128) NOT NULL,
	"short_intro" text NOT NULL,
	"introVideo" varchar(500) NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "discount" (
	"id" varchar PRIMARY KEY NOT NULL,
	"trip_id" varchar(128) NOT NULL,
	"valid_till" timestamp NOT NULL,
	"status" "discount_status" DEFAULT 'active' NOT NULL,
	"discountCode" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"discount_percentage" integer NOT NULL,
	"max_usage" numeric(12, 4) DEFAULT '0',
	"amount" numeric(12, 4) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY NOT NULL,
	"platformName" varchar(255) NOT NULL,
	"timeZone" varchar(100) NOT NULL,
	"logo" varchar(500) NOT NULL,
	"defaultLanguage" varchar(50) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"chatWidget" boolean NOT NULL,
	"trip_categories" jsonb NOT NULL,
	"defaultApproval" varchar(50) NOT NULL,
	"default_max_participants" integer NOT NULL,
	"default_min_participants" integer NOT NULL,
	"email_notification" boolean NOT NULL,
	"reminder_days" integer NOT NULL,
	"send_sms" boolean NOT NULL,
	"two_factor_enabled" boolean NOT NULL,
	"session_timeout" integer NOT NULL,
	"max_logins" integer NOT NULL,
	"min_password_length" integer NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"trip_id" varchar(128),
	"amount" numeric(12, 4) NOT NULL,
	"status" "payment_status" NOT NULL,
	"last4" varchar(4),
	"currency" varchar(10),
	"membershipType" varchar(50),
	"membership_expiry" timestamp,
	"method" varchar(50) NOT NULL,
	"cardExpiry" varchar(10),
	"stripeCustomerId" varchar(255),
	"membershipId" varchar(255),
	"membershipAvailable" boolean NOT NULL,
	"discountAvailable" boolean NOT NULL,
	"validTill" varchar(50),
	"stripePaymentId" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "Reviews" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"trip_id" varchar(128) NOT NULL,
	"rating" integer NOT NULL,
	"review" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"coverImage" varchar(500) NOT NULL,
	"type" varchar(100) NOT NULL,
	"location" varchar(255) NOT NULL,
	"mapCoordinates" varchar(255),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"duration" varchar(100) NOT NULL,
	"long_desc" text NOT NULL,
	"groupSize" varchar(50) NOT NULL,
	"rhythm" varchar(100) NOT NULL,
	"sportLvl" varchar(100) NOT NULL,
	"weekendTt" varchar(100) NOT NULL,
	"included" jsonb,
	"status" "trip_status" DEFAULT 'pending' NOT NULL,
	"not_included" jsonb,
	"short_desc" text NOT NULL,
	"instaLink" varchar(500),
	"likedinLink" varchar(500),
	"promotionalVideo" varchar(500) NOT NULL,
	"gallery_images" jsonb NOT NULL,
	"best_price_msg" text NOT NULL,
	"perHeadPrice" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "Application" ADD CONSTRAINT "Application_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Application" ADD CONSTRAINT "Application_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount" ADD CONSTRAINT "discount_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;