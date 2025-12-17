ALTER TABLE "users" ADD COLUMN "FirstName" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "LastName" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "NickName" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "Address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "PhoneNumber" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "DOB" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "Gender" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "Password" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "firstName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "lastName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "alias";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "fullHomeAddress";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "gender";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "specialDiet";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "specialDietOther";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "profilePic";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";