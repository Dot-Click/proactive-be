import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { messages } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and, isNull } from "drizzle-orm";

/**
 * @swagger
 * /api/chat/{chatId}/messages/{messageId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Delete a message
 *     description: Soft delete a message (sender or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
export const deleteMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId, messageId } = req.params;
    const db = await database();
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get message
    const messageResults = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.chatId, chatId),
          isNull(messages.deletedAt)
        )
      )
      .limit(1);

    if (messageResults.length === 0) {
      return sendError(res, "Message not found", status.NOT_FOUND);
    }

    const message = messageResults[0];

    // Check permissions (sender or admin)
    if (message.senderId !== userId && userRole !== "admin") {
      return sendError(
        res,
        "You can only delete your own messages",
        status.FORBIDDEN
      );
    }

    // Soft delete message
    await db
      .update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));

    return sendSuccess(
      res,
      "Message deleted successfully",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Delete message error:", error);
    return sendError(
      res,
      "An error occurred while deleting message",
      status.INTERNAL_SERVER_ERROR
    );
  }
};


