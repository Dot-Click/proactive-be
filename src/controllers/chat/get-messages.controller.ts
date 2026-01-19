import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { messages, chatParticipants, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { eq, and, desc } from "drizzle-orm";

export const getMessages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { id } = req.params;
    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (page < 1 || limit < 1 || limit > 100) {
      return sendError(res, "Invalid pagination parameters", status.BAD_REQUEST);
    }

    const db = await database();

    // Check if user is admin
    const isAdmin = req.user.role === "admin";

    // Verify user is participant (skip for admin)
    if (!isAdmin) {
      const [chatParticipant] = await db
        .select()
        .from(chatParticipants)
        .where(and(
          eq(chatParticipants.chatId, id),
          eq(chatParticipants.userId, userId)
        ))
        .limit(1);

      if (!chatParticipant) {
        return sendError(res, "You are not a participant of this chat", status.FORBIDDEN);
      }
    }

    const skip = (page - 1) * limit;

    // Get messages with pagination
    const messagesData = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        chatId: messages.chatId,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userRoles: users.userRoles,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, id))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(skip);

    // Reverse to get chronological order
    const reversedMessages = messagesData.reverse().map(m => ({
      ...m,
      sender: {
        id: m.sender.id,
        name: (m.sender.firstName && m.sender.lastName) ? `${m.sender.firstName} ${m.sender.lastName}` : m.sender.email.split('@')[0],
        email: m.sender.email,
        role: m.sender.userRoles,
      },
    }));

    return sendSuccess(
      res,
      "Messages retrieved successfully",
      reversedMessages,
      status.OK
    );
  } catch (error: any) {
    console.error("Error getting messages:", error);
    return sendError(
      res,
      error.message || "Failed to get messages",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

