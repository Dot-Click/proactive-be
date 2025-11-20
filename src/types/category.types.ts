import { z } from "zod";

/**
 * Create category request body schema
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(255, "Category name must be less than 255 characters"),
  isActive: z.boolean().optional().default(true),
});

/**
 * Update category request body schema
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(255, "Category name must be less than 255 characters")
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Create category request type
 */
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;

/**
 * Update category request type
 */
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;

