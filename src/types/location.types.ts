import { z } from "zod";

/**
 * Create location request body schema
 */
export const createLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Location name is required")
    .max(255, "Location name must be less than 255 characters"),
});

/**
 * Update location request body schema
 */
export const updateLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Location name is required")
    .max(255, "Location name must be less than 255 characters")
    .optional(),
});

/**
 * Create location request type
 */
export type CreateLocationRequest = z.infer<typeof createLocationSchema>;

/**
 * Update location request type
 */
export type UpdateLocationRequest = z.infer<typeof updateLocationSchema>;
