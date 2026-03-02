import { z } from "zod";

export const googleReviewSchema = z.object({
  id: z.string().uuid(),
  reviewerName: z.string(),
  reviewText: z.string(),
  stars: z.number().int().min(0).max(5),
  language: z.enum(["en", "es"]),
  profilePicture: z.string().url().optional().nullable(),
  reviewLink: z.string().url().optional().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GoogleReview = z.infer<typeof googleReviewSchema>;
