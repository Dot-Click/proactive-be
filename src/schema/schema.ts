import {
  text,
  pgTable,
  varchar,
  boolean,
  timestamp,
  ReferenceConfig,
  pgEnum,
  numeric,
  jsonb,
  integer,
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

// Payment Status Enum
export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "unpaid",
  "pending",
  "failed",
  "refunded",
]);

// Trip Approval Status Enum
export const tripApprovalStatusEnum = pgEnum("trip_approval_status", [
  "pending",
  "approved",
  "unpublished",
  "rejected",
]);
// Trip Status Enum
export const tripStatusEnum = pgEnum("trip_status", [
  "pending",
  "active",
  "completed",
  "open",
  "live",
]);

// Discount Status Enum
export const discountStatusEnum = pgEnum("discount_status", [
  "active",
  "inactive",
  "expired",
  "used",
]);

// Application Status Enum
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid().primaryKey(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  nickName: varchar("nickName", { length: 200 }),
  address: text("address"),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  dob: varchar("dob", { length: 20 }),
  gender: varchar("gender", { length: 20 }),
  password: varchar("password", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  emailVerified: boolean("emailVerified")
    .$defaultFn(() => false)
    .notNull(),
  userRoles: varchar("userRoles", { length: 20 }).default("user"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").$onUpdateFn(() => new Date()),
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

// Trip table
export const trips = pgTable("trips", {
  id: uuid().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  coverImage: varchar({ length: 500 }).notNull(),
  type: varchar({ length: 100 }).notNull(),
  location: varchar({ length: 255 }).notNull(),
  mapCoordinates: varchar({ length: 255 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  duration: varchar({ length: 100 }).notNull(),
  longDesc: text("long_desc").notNull(),
  groupSize: varchar({ length: 50 }).notNull(),
  rhythm: varchar({ length: 100 }).notNull(),
  sportLvl: varchar({ length: 100 }).notNull(),
  weekendTt: varchar({ length: 100 }).notNull(),
  included: jsonb("included"),
  status: tripStatusEnum("status").default("pending").notNull(),
  approvalStatus: tripApprovalStatusEnum("approval_status").default("pending").notNull(),
  notIncluded: jsonb("not_included"),
  shortDesc: text("short_desc").notNull(),
  instaLink: varchar({ length: 500 }),
  likedinLink: varchar({ length: 500 }), // Note: typo preserved from original
  promotionalVideo: varchar({ length: 500 }).notNull(),
  galleryImages: jsonb("gallery_images").notNull(), // Array stored as JSONB
  bestPriceMsg: text("best_price_msg").notNull(),
  perHeadPrice: varchar({ length: 100 }).notNull(),
  ...timeStamps,
});

// Trip Coordinators junction table (many-to-many relationship)
export const tripCoordinators = pgTable("trip_coordinators", {
  id: uuid().primaryKey(),
  tripId: foreignkeyRef("trip_id", () => trips.id, {
    onDelete: "cascade",
  }).notNull(),
  userId: foreignkeyRef("user_id", () => users.id, {
    onDelete: "cascade",
  }).notNull(),
  ...timeStamps,
});

// Payment table
export const payments = pgTable("payments", {
  id: uuid().primaryKey(),
  userId: foreignkeyRef("user_id", () => users.id, {
    onDelete: "cascade",
  }).notNull(),
  tripId: foreignkeyRef("trip_id", () => trips.id, {
    onDelete: "cascade",
  }),
  amount: numeric("amount", { precision: 12, scale: 4 }).notNull(),
  status: paymentStatusEnum("status").notNull(),
  last4: varchar({ length: 4 }),
  currency: varchar({ length: 10 }),
  membershipType: varchar({ length: 50 }),
  membershipExpiry: timestamp("membership_expiry"),
  method: varchar({ length: 50 }).notNull(),
  cardExpiry: varchar({ length: 10 }),
  stripeCustomerId: varchar({ length: 255 }),
  membershipId: varchar({ length: 255 }),
  membershipAvailable: boolean()
    .$defaultFn(() => false)
    .notNull(),
  discountAvailable: boolean()
    .$defaultFn(() => false)
    .notNull(),
  validTill: varchar({ length: 50 }),
  stripePaymentId: varchar({ length: 255 }).notNull(),
  ...timeStamps,
});

// Discount table
export const discounts = pgTable("discount", {
  id: uuid().primaryKey(),
  tripId: foreignkeyRef("trip_id", () => trips.id, {
    onDelete: "cascade",
  }).notNull(),
  validTill: timestamp("valid_till").notNull(),
  status: discountStatusEnum("status").default("active").notNull(),
  discountCode: varchar({ length: 100 }).notNull(),
  description: text().notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  maxUsage: numeric("max_usage", { precision: 12, scale: 4 }).default("0"),
  amount: numeric("amount", { precision: 12, scale: 4 }).notNull(),
  ...timeStamps,
});

// Application table
export const applications = pgTable("Application", {
  id: uuid().primaryKey(),
  userId: foreignkeyRef("user_id", () => users.id, {
    onDelete: "cascade",
  }).notNull(),
  tripId: foreignkeyRef("trip_id", () => trips.id, {
    onDelete: "cascade",
  }).notNull(),
  shortIntro: text("short_intro").notNull(),
  introVideo: varchar({ length: 500 }).notNull(),
  status: applicationStatusEnum("status").default("pending").notNull(),
  ...timeStamps,
});

// Reviews table
export const reviews = pgTable("Reviews", {
  id: uuid().primaryKey(),
  userId: foreignkeyRef("user_id", () => users.id, {
    onDelete: "cascade",
  }).notNull(),
  tripId: foreignkeyRef("trip_id", () => trips.id, {
    onDelete: "cascade",
  }).notNull(),
  rating: integer().notNull(),
  review: text().notNull(),
  ...timeStamps,
});

// Global Settings table
export const globalSettings = pgTable("settings", {
  id: uuid().primaryKey(),
  // Platform settings
  platformName: varchar({ length: 255 }).notNull(),
  timeZone: varchar({ length: 100 }).notNull(),
  logo: varchar({ length: 500 }).notNull(),
  defaultLanguage: varchar({ length: 50 }).notNull(),
  currency: varchar({ length: 10 }).notNull(),
  chatWidget: boolean()
    .$defaultFn(() => false)
    .notNull(),
  // Trip settings
  tripCategories: jsonb("trip_categories").notNull(), // Array of JSON objects
  defaultApproval: varchar({ length: 50 }).notNull(),
  defaultMaxParticipants: integer("default_max_participants").notNull(),
  defaultMinParticipants: integer("default_min_participants").notNull(),
  // Notification settings
  emailNotification: boolean("email_notification").notNull(),
  reminderDays: integer("reminder_days").notNull(),
  sendSms: boolean("send_sms").notNull(),
  // Security settings
  twoFactorEnabled: boolean("two_factor_enabled").notNull(),
  sessionTimeout: integer("session_timeout").notNull(),
  maxLogins: integer("max_logins").notNull(),
  minPasswordLength: integer("min_password_length").notNull(),
  ...timeStamps,
});

export const userInsertSchema = createInsertSchema(users);
