import { z } from "zod";

/**
 * Create FAQ request body schema
 */
export const createFaqSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(1000, "Question must be less than 1000 characters"),
  answers: z
    .string()
    .min(1, "Answer is required")
    .max(5000, "Answer must be less than 5000 characters"),
});

/**
 * Update FAQ request body schema
 */
export const updateFaqSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(1000, "Question must be less than 1000 characters")
    .optional(),
  answers: z
    .string()
    .min(1, "Answer is required")
    .max(5000, "Answer must be less than 5000 characters")
    .optional(),
});

/**
 * Create FAQ request type
 */
export type CreateFaqRequest = z.infer<typeof createFaqSchema>;

/**
 * Update FAQ request type
 */
export type UpdateFaqRequest = z.infer<typeof updateFaqSchema>;
