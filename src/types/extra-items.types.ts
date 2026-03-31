import { z } from "zod";

export const extraItemTypeEnum = z.enum(["included", "not_included"]);

export const createExtraItemSchema = z.object({
  type: extraItemTypeEnum,
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export const updateExtraItemSchema = z.object({
  type: extraItemTypeEnum.optional(),
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});
