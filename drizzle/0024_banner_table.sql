CREATE TABLE IF NOT EXISTS "banner" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
