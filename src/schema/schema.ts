import {
  text,
  pgTable,
  varchar,
  boolean,
  timestamp,
  ReferenceConfig,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema } from "drizzle-zod";

const timeStamps = {
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => new Date()),
};

type UUIDOptions = Exclude<Parameters<typeof varchar>[1], undefined>;

const uuid = (columnName?: string, options?: UUIDOptions) =>
  varchar(columnName ?? "id", options).$defaultFn(() => createId());

const foreignkeyRef = (
  columnName: string,
  refColumn: ReferenceConfig["ref"],
  actions?: ReferenceConfig["actions"]
) => varchar(columnName, { length: 128 }).references(refColumn, actions);

export const users = pgTable("users", {
  id: uuid().primaryKey(),
  FirstName: varchar({ length: 100 }),
  LastName: varchar({ length: 100 }),
  NickName: varchar({ length: 200 }), // Full name field
  // alias: varchar({ length: 100 }), // Alias/nickname
  Address: text(), // Full home address
  PhoneNumber: varchar({ length: 20 }), // Phone number
  DOB: varchar({ length: 20 }), // Date of birth
  Gender: varchar({ length: 20 }), // Gender field
  // specialDiet: varchar({ length: 20 }), // Special diet: "vegetarian", "vegan", "gluten-free", "other"
  // specialDietOther: text(), // Custom diet description when specialDiet is "other"
  // profilePic: varchar({ length: 256 }),
  Password: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 100 }).notNull().unique(),
  emailVerified: boolean()
    .$defaultFn(() => false)
    .notNull(),
  userRoles: varchar({ length: 20 }).default("user"), // Allowed values: "user", "coordinator", "admin"
  ...timeStamps,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: foreignkeyRef("user_id", () => users.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().$defaultFn(() => new Date()),
  updatedAt: timestamp().$defaultFn(() => new Date()),
});

export const chats = pgTable("chats", {
  id: uuid().primaryKey(),
  name: varchar({ length: 255 }),
  description: text(),
  coordinatorId: foreignkeyRef("coordinator_id", () => users.id, {
    onDelete: "cascade",
  }),
  createdBy: foreignkeyRef("created_by", () => users.id, {
    onDelete: "cascade",
  }).notNull(),
  ...timeStamps,
});

export const chatParticipants = pgTable("chat_participants", {
  id: uuid().primaryKey(),
  chatId: foreignkeyRef("chat_id", () => chats.id, {
    onDelete: "cascade",
  }).notNull(),
  userId: foreignkeyRef("user_id", () => users.id, {
    onDelete: "cascade",
  }).notNull(),
  role: varchar({ length: 20 }).default("participant"), // participant, admin
  joinedAt: timestamp().defaultNow(),
  ...timeStamps,
});

export const messages = pgTable("messages", {
  id: uuid().primaryKey(),
  chatId: foreignkeyRef("chat_id", () => chats.id, {
    onDelete: "cascade",
  }).notNull(),
  senderId: foreignkeyRef("sender_id", () => users.id, {
    onDelete: "cascade",
  }).notNull(),
  content: text().notNull(),
  editedAt: timestamp(),
  deletedAt: timestamp(),
  ...timeStamps,
});

export const faqs = pgTable("faqs", {
  id: uuid().primaryKey(),
  question: text().notNull(),
  answers: text().notNull(),
  ...timeStamps,
});

export const categories = pgTable("categories", {
  id: uuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  isActive: boolean()
    .$defaultFn(() => true)
    .notNull(),
  ...timeStamps,
});

export const userInsertSchema = createInsertSchema(users);
