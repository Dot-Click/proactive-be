import { z } from "zod";

/**
 * Application submission schema
 */
export const createApplicationSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  shortIntro: z.string().min(1, "Short introduction is required"),
  introVideo: z.string().url("Intro video must be a valid URL").max(500, "Intro video URL must be less than 500 characters"),
  dietaryRestrictions: z.string().optional(),
}).strict();

export type CreateApplicationRequest = z.infer<typeof createApplicationSchema>;