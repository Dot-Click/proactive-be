import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants, users, messages, trips } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { eq, and, asc } from "drizzle-orm";

export const getChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const db = await database();

    // Verify user is participant
    const [chatParticipant] = await db
      .select()
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, id),
        eq(chatParticipants.userId, userId)
      ))
      .limit(1);

    if (!chatParticipant) {
      return sendError(res, "Chat not found or access denied", status.NOT_FOUND);
    }

    // Get chat
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, id))
      .limit(1);

    if (!chat) {
      return sendError(res, "Chat not found", status.NOT_FOUND);
    }

    // Get participants with user details
    const participantsData = await db
      .select({
        id: chatParticipants.id,
        userId: chatParticipants.userId,
        role: chatParticipants.role,
        joinedAt: chatParticipants.joinedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userRoles: users.userRoles,
        },
      })
      .from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, id));

    // Get all messages
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
      .orderBy(asc(messages.createdAt));

    // Get trip details
    let tripData = null;
    if (chat.tripId) {
      const [trip] = await db
        .select({
          id: trips.id,
          title: trips.title,
        })
        .from(trips)
        .where(eq(trips.id, chat.tripId))
        .limit(1);
      tripData = trip;
    }

    const chatData = {
      ...chat,
      participants: participantsData.map(p => ({
        ...p,
        user: {
          id: p.user.id,
          name: (p.user.firstName && p.user.lastName) ? `${p.user.firstName} ${p.user.lastName}` : p.user.email.split('@')[0],
          email: p.user.email,
          role: p.user.userRoles,
        },
      })),
      messages: messagesData.map(m => ({
        ...m,
        sender: {
          id: m.sender.id,
          name: (m.sender.firstName && m.sender.lastName) ? `${m.sender.firstName} ${m.sender.lastName}` : m.sender.email.split('@')[0],
          email: m.sender.email,
          role: m.sender.userRoles,
        },
      })),
      trip: tripData,
    };

    return sendSuccess(
      res,
      "Chat retrieved successfully",
      chatData,
      status.OK
    );
  } catch (error: any) {
    console.error("Error getting chat:", error);
    return sendError(
      res,
      error.message || "Failed to get chat",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
