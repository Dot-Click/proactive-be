import { z } from "zod";

export const createCoordinatorSchema = z.object({
  fullName: z.string().max(200),
  phoneNumber: z.string().max(20),
  bio: z.string(),
  prof_pic: z.string().optional(),
  specialities: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(z.string())),
  languages: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(z.string())),
  certificateLvl: z.string().max(20),
  yearsOfExperience: z.coerce.number(),
  location: z.string().max(100).optional(),
  type: z.string().max(20),
  accessLvl: z.string().max(20),
  notificationPref: z.object({
    emailNotf: z.boolean(),
    appAlert: z.boolean(),
    reviewNotf: z.boolean(),
  }).optional().default({ emailNotf: false, appAlert: false, reviewNotf: false }),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateCoordinatorRequest = z.infer<typeof createCoordinatorSchema>;

/**
 * Settings update schema (all fields optional for partial updates)
 */
export const updateSettingsSchema = z.object({
  platformName: z.string().max(255).optional(),
  timeZone: z.string().max(100).optional(),
  logo: z.string().max(500).optional(),
  defaultLanguage: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
  chatWidget: z.coerce.boolean().optional(),
  tripCategories: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    enabled: z.coerce.boolean().optional(),
  }).passthrough()).optional()),
  defaultApproval: z.string().max(50).optional(),
  defaultMaxParticipants: z.coerce.number().int().positive().optional(),
  defaultMinParticipants: z.coerce.number().int().positive().optional(),
  emailNotification: z.coerce.boolean().optional(),
  reminderDays: z.coerce.number().int().nonnegative().optional(),
  sendSms: z.coerce.boolean().optional(),
  twoFactorEnabled: z.coerce.boolean().optional(),
  sessionTimeout: z.coerce.number().int().positive().optional(),
  maxLogins: z.coerce.number().int().positive().optional(),
  minPasswordLength: z.coerce.number().int().positive().optional(),
  contactAddress: z.string().max(500).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().max(255).optional(),
  mapLat: z.string().max(50).optional(),
  mapLng: z.string().max(50).optional(),
}).strict();

/**
 * Settings create schema (all fields required for initial creation)
 */
export const createSettingsSchema = updateSettingsSchema.extend({
  platformName: z.string().max(255),
  timeZone: z.string().max(100),
  logo: z.string().max(500),
  defaultLanguage: z.string().max(50),
  currency: z.string().max(10),
  tripCategories: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    enabled: z.coerce.boolean().optional(),
  }).passthrough())),
  defaultApproval: z.string().max(50),
  defaultMaxParticipants: z.coerce.number().int().positive(),
  defaultMinParticipants: z.coerce.number().int().positive(),
  emailNotification: z.coerce.boolean(),
  reminderDays: z.coerce.number().int().nonnegative(),
  sendSms: z.coerce.boolean(),
  twoFactorEnabled: z.coerce.boolean(),
  sessionTimeout: z.coerce.number().int().positive(),
  maxLogins: z.coerce.number().int().positive(),
  minPasswordLength: z.coerce.number().int().positive(),
});

export const emailSendings = z.object({
  subject: z.string().optional(),
  emailText: z.string(),
  userEmail: z.string()
})
export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;
export type CreateSettingsRequest = z.infer<typeof createSettingsSchema>;
