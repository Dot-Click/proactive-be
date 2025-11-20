import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { messages, chats, chatParticipants } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { sendMessageSchema } from "@/types/chat.types";
import { RequestWithIO } from "@/types/socket";
import { emitToChatRoom, getMessageWithSender } from "@/utils/socket-chat.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a message to a chat
 *     description: Send a text message to a chat (participants only)
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hello everyone!
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - not a participant
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const validationResult = sendMessageSchema.safeParse({
      ...req.body,
      chatId,
    });
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
    const userRole = req.user.role;

    // Verify chat exists
    const chatResults = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chatResults.length === 0) {
      return sendError(res, "Chat not found", status.NOT_FOUND);
    }

    // Check if user is a participant (admin can always send)
    if (userRole !== "admin") {
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
        return sendError(
          res,
          "You must be a participant to send messages",
          status.FORBIDDEN
        );
      }
    }

    // Create message
    const newMessage = await db
      .insert(messages)
      .values({
        id: createId(),
        chatId,
        senderId: userId,
        content,
      })
      .returning();

    // Get message with sender details
    const messageWithSender = await getMessageWithSender(newMessage[0].id);

    if (!messageWithSender) {
      return sendError(
        res,
        "Failed to retrieve message",
        status.INTERNAL_SERVER_ERROR
      );
    }

    // Emit to all chat participants via socket
    const reqWithIO = req as Request & RequestWithIO;
    if (reqWithIO.io) {
      await emitToChatRoom(reqWithIO.io, chatId, "message:new", {
        message: messageWithSender,
      });
    }

    return sendSuccess(
      res,
      "Message sent successfully",
      { message: messageWithSender },
      status.CREATED
    );
  } catch (error) {
    console.error("Send message error:", error);
    return sendError(
      res,
      "An error occurred while sending message",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
