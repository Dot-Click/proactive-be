ALTER TABLE "users" ALTER COLUMN "userRoles" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "userRoles" SET DEFAULT 'user';