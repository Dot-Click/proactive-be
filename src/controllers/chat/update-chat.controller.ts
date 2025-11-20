import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { updateChatSchema } from "@/types/chat.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and } from "drizzle-orm";

/**
 * @swagger
 * /api/chat/{chatId}:
 *   put:
 *     tags:
 *       - Chat
 *     summary: Update a chat
 *     description: Update chat details (admin or coordinator of the chat)
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
export const updateChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const validationResult = updateChatSchema.safeParse(req.body);
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
      // Also check if user is admin participant
      const participantResults = await db
        .select()
        .from(chatParticipants)
        .where(
          and(
            eq(chatParticipants.chatId, chatId),
            eq(chatParticipants.userId, userId),
            eq(chatParticipants.role, "admin")
          )
        )
        .limit(1);

      if (participantResults.length === 0) {
        return sendError(
          res,
          "You don't have permission to update this chat",
          status.FORBIDDEN
        );
      }
    }

    // Update chat
    const updateData: any = {};
    if (validationResult.data.name !== undefined) {
      updateData.name = validationResult.data.name;
    }
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }

    const updatedChat = await db
      .update(chats)
      .set(updateData)
      .where(eq(chats.id, chatId))
      .returning();

    return sendSuccess(
      res,
      "Chat updated successfully",
      { chat: updatedChat[0] },
      status.OK
    );
  } catch (error) {
    console.error("Update chat error:", error);
    return sendError(
      res,
      "An error occurred while updating chat",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
