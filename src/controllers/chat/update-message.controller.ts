import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { messages } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { updateMessageSchema } from "@/types/chat.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and, isNull } from "drizzle-orm";

/**
 * @swagger
 * /api/chat/{chatId}/messages/{messageId}:
 *   put:
 *     tags:
 *       - Chat
 *     summary: Update a message
 *     description: Update a message (sender only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
export const updateMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId, messageId } = req.params;
    const validationResult = updateMessageSchema.safeParse(req.body);
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

    const { content } = validationResult.data;
    const db = await database();
    const userId = req.user.userId;

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

    // Check if user is the sender
    if (message.senderId !== userId) {
      return sendError(
        res,
        "You can only edit your own messages",
        status.FORBIDDEN
      );
    }

    // Update message
    const updatedMessage = await db
      .update(messages)
      .set({
        content,
        editedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    return sendSuccess(
      res,
      "Message updated successfully",
      { message: updatedMessage[0] },
      status.OK
    );
  } catch (error) {
    console.error("Update message error:", error);
    return sendError(
      res,
      "An error occurred while updating message",
      status.INTERNAL_SERVER_ERROR
    );
  }
};


