import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, sql } from "drizzle-orm";

/**
 * @swagger
 * /api/chat:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get all chats for current user
 *     description: Returns chats based on user role (admin sees all, coordinator sees their chats, user sees chats they're in)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chats
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getChats = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const db = await database();
    const userRole = req.user.role;
    const userId = req.user.userId;

    let chatResults;

    if (userRole === "admin") {
      // Admin sees all chats
      chatResults = await db
        .select({
          id: chats.id,
          name: chats.name,
          description: chats.description,
          coordinatorId: chats.coordinatorId,
          createdBy: chats.createdBy,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats);
    } else if (userRole === "coordinator") {
      // Coordinator sees chats where they are the coordinator
      chatResults = await db
        .select({
          id: chats.id,
          name: chats.name,
          description: chats.description,
          coordinatorId: chats.coordinatorId,
          createdBy: chats.createdBy,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .where(eq(chats.coordinatorId, userId));
    } else {
      // User sees chats where they are a participant
      chatResults = await db
        .select({
          id: chats.id,
          name: chats.name,
          description: chats.description,
          coordinatorId: chats.coordinatorId,
          createdBy: chats.createdBy,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
        })
        .from(chats)
        .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
        .where(eq(chatParticipants.userId, userId));
    }

    // Get participant counts for each chat
    const chatsWithCounts = await Promise.all(
      chatResults.map(async (chat) => {
        const participantCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(chatParticipants)
          .where(eq(chatParticipants.chatId, chat.id));

        return {
          ...chat,
          participantCount: Number(participantCount[0]?.count || 0),
        };
      })
    );

    return sendSuccess(
      res,
      "Chats retrieved successfully",
      { chats: chatsWithCounts },
      status.OK
    );
  } catch (error) {
    console.error("Get chats error:", error);
    return sendError(
      res,
      "An error occurred while retrieving chats",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
