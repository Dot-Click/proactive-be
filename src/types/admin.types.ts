import { z } from "zod";

export const createCoordinatorSchema = z.object({
  coordinatorDetails: z.preprocess((val) => {
    if (typeof val === "string") {
      return JSON.parse(val);
    }
    return val;
  }, z.object({
    fullName: z.string(),
    phoneNumber: z.string(),
    bio: z.string(),
    profilePicture: z.string(),
    specialities: z.array(z.string()),
    languages: z.array(z.string()),
    certificateLvl: z.string(),
    yearsOfExperience: z.number(),
    type: z.string(),
    accessLvl: z.string(),
  })),
  email: z.string().email(),
  password: z.string(),
  
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

export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;
export type CreateSettingsRequest = z.infer<typeof createSettingsSchema>;
