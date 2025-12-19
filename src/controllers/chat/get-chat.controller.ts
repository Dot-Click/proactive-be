import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and } from "drizzle-orm";

/**
 * @swagger
 * /api/chat/{chatId}:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get a specific chat
 *     description: Get chat details with participants
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
 *         description: Chat details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not a participant
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 */
export const getChat = async (
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

    // Check access permissions
    if (userRole !== "admin") {
      if (userRole === "coordinator" && chat.coordinatorId !== userId) {
        return sendError(
          res,
          "You don't have access to this chat",
          status.FORBIDDEN
        );
      } else if (userRole === "user") {
        // Check if user is a participant
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
            "You don't have access to this chat",
            status.FORBIDDEN
          );
        }
      }
    }

    // Get participants with user details
    const participants = await db
      .select({
        id: chatParticipants.id,
        userId: chatParticipants.userId,
        role: chatParticipants.role,
        joinedAt: chatParticipants.joinedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        userRole: users.userRoles,
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, chatId));

    // Get coordinator details
    let coordinator = null;
    if (chat.coordinatorId) {
      const coordinatorResults = await db
        .select()
        .from(users)
        .where(eq(users.id, chat.coordinatorId))
        .limit(1);
      coordinator = coordinatorResults[0] || null;
    }

    return sendSuccess(
      res,
      "Chat retrieved successfully",
      {
        chat: {
          ...chat,
          coordinator,
          participants,
        },
      },
      status.OK
    );
  } catch (error) {
    console.error("Get chat error:", error);
    return sendError(
      res,
      "An error occurred while retrieving chat",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
