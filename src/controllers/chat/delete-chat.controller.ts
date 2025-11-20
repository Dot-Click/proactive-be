import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/chat/{chatId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Delete a chat
 *     description: Delete a chat (admin or coordinator of the chat)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
export const deleteChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const db = await database();
    const userId = req.user.userId;
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
    if (userRole !== "admin" && chat.coordinatorId !== userId) {
      return sendError(
        res,
        "You don't have permission to delete this chat",
        status.FORBIDDEN
      );
    }

    // Delete chat (cascade will handle participants and messages)
    await db.delete(chats).where(eq(chats.id, chatId));

    return sendSuccess(res, "Chat deleted successfully", undefined, status.OK);
  } catch (error) {
    console.error("Delete chat error:", error);
    return sendError(
      res,
      "An error occurred while deleting chat",
      status.INTERNAL_SERVER_ERROR
    );
  }
};


