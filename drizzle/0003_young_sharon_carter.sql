CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"isActive" boolean NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" varchar PRIMARY KEY NOT NULL,
	"chat_id" varchar(128) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"role" varchar(20) DEFAULT 'participant',
	"joinedAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"description" text,
	"coordinator_id" varchar(128),
	"created_by" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answers" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"chat_id" varchar(128) NOT NULL,
	"sender_id" varchar(128) NOT NULL,
	"content" text NOT NULL,
	"editedAt" timestamp,
	"deletedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alias" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fullHomeAddress" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "specialDiet" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "specialDietOther" text;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_coordinator_id_users_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;