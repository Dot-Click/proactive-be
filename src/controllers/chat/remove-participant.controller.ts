import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and } from "drizzle-orm";

/**
 * @swagger
 * /api/chat/{chatId}/participants/{userId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Remove a participant from a chat
 *     description: Remove a participant (admin, coordinator, or self)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Participant not found
 *       500:
 *         description: Internal server error
 */
export const removeParticipant = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId, userId } = req.params;
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

    // Check permissions (admin, coordinator, or self)
    const isSelf = userId === currentUserId;
    const isAdmin = userRole === "admin";
    const isCoordinator = chat.coordinatorId === currentUserId;

    if (!isSelf && !isAdmin && !isCoordinator) {
      return sendError(
        res,
        "You don't have permission to remove this participant",
        status.FORBIDDEN
      );
    }

    // Check if participant exists
    const participantResults = await db
      .select()
      .from(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      )
      .limit(1);

    if (participantResults.length === 0) {
      return sendError(res, "Participant not found", status.NOT_FOUND);
    }

    // Remove participant
    await db
      .delete(chatParticipants)
      .where(
        and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId)
        )
      );

    return sendSuccess(
      res,
      "Participant removed successfully",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Remove participant error:", error);
    return sendError(
      res,
      "An error occurred while removing participant",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
