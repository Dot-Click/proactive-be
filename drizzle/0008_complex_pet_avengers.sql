ALTER TABLE "users" ADD COLUMN "firstName" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastName" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nickName" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phoneNumber" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dob" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "FirstName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "LastName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "NickName";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "Address";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "PhoneNumber";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "DOB";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "Gender";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "Password";