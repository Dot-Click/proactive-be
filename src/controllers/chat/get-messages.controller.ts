import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { messages, chats, chatParticipants, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and, isNull, desc } from "drizzle-orm";

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get messages from a chat
 *     description: Get paginated messages from a chat (participants only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       403:
 *         description: Forbidden - not a participant
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
export const getMessages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { chatId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

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

    // Check if user is a participant (admin can always view)
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
          "You must be a participant to view messages",
          status.FORBIDDEN
        );
      }
    }

    // Get messages with sender details (excluding deleted messages)
    const messageResults = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderEmail: users.email,
        senderProfilePic: users.profilePic,
        content: messages.content,
        editedAt: messages.editedAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: messages.id })
      .from(messages)
      .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)));

    return sendSuccess(
      res,
      "Messages retrieved successfully",
      {
        messages: messageResults.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          total: totalCount.length,
          totalPages: Math.ceil(totalCount.length / limit),
        },
      },
      status.OK
    );
  } catch (error) {
    console.error("Get messages error:", error);
    return sendError(
      res,
      "An error occurred while retrieving messages",
      status.INTERNAL_SERVER_ERROR
    );
  }
};


