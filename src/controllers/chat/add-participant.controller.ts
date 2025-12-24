import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { addParticipantSchema } from "@/types/chat.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { createNotification } from "@/services/notifications.services";

/**
 * @swagger
 * /api/chat/{chatId}/participants:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Add a participant to a chat
 *     description: Add a user as participant (admin or coordinator)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant added successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Chat or user not found
 *       500:
 *         description: Internal server error
 */
export const addParticipant = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const validationResult = addParticipantSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        errors
      );
    }

    const { userId } = validationResult.data;
    const db = await database();
    const currentUserId = req.user.userId;
    const userRole = req.user.role;

    // Get chat
    const chatResults = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chatResults.length === 0) {
      return sendError(res, "Chat not found", status.NOT_FOUND);
    }

    const chat = chatResults[0];

    // Check permissions (admin or coordinator of the chat)
    if (userRole !== "admin" && chat.coordinatorId !== currentUserId) {
      return sendError(
        res,
        "You don't have permission to add participants to this chat",
        status.FORBIDDEN
      );
    }

    // Verify user exists
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResults.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    // Check if user is already a participant
    const existingParticipant = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      )
      .limit(1);

    if (existingParticipant.length > 0) {
      return sendError(
        res,
        "User is already a participant in this chat",
        status.BAD_REQUEST
      );
    }

    // Add participant
    const newParticipant = await db
      .insert(chatParticipants)
      .values({
        id: createId(),
        chatId,
        userId,
        role: "participant",
      })
      .returning();
    await createNotification({
      userId: currentUserId,
      title: "You are added to a new chat",
      description: `You are added to a new chat ${chat.name} by ${userResults[0].firstName + " " + userResults[0].lastName}`,
      type: "chat",
    });
    return sendSuccess(
      res,
      "Participant added successfully",
      { participant: newParticipant[0] },
      status.OK
    );
  } catch (error) {
    console.error("Add participant error:", error);
    return sendError(
      res,
      "An error occurred while adding participant",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
