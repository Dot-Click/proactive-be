import { z } from "zod";

/**
 * Create chat request body schema
 */
export const createChatSchema = z.object({
  name: z
    .string()
    .min(1, "Chat name is required")
    .max(255, "Chat name too long"),
  description: z.string().optional(),
  coordinatorId: z.string().min(1, "Coordinator ID is required"),
  participantIds: z
    .array(z.string())
    .min(1, "At least one participant is required"),
});

/**
 * Update chat request body schema
 */
export const updateChatSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

/**
 * Send message request body schema
 */
export const sendMessageSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(5000, "Message too long"),
});

/**
 * Update message request body schema
 */
export const updateMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(5000, "Message too long"),
});

/**
 * Add participant request body schema
 */
export const addParticipantSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Create chat request type
 */
export type CreateChatRequest = z.infer<typeof createChatSchema>;

/**
 * Update chat request type
 */
export type UpdateChatRequest = z.infer<typeof updateChatSchema>;

/**
 * Send message request type
 */
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;

/**
 * Update message request type
 */
export type UpdateMessageRequest = z.infer<typeof updateMessageSchema>;

/**
 * Add participant request type
 */
export type AddParticipantRequest = z.infer<typeof addParticipantSchema>;

