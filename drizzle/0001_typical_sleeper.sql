ALTER TABLE "users" ALTER COLUMN "userRoles" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "userRoles" SET DEFAULT 'user';