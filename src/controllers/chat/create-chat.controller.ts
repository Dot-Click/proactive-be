import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants, users, trips, messages } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

export const createChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { participantIds, tripId } = req.body;
    const userId = req.user.userId;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return sendError(res, "Participant IDs are required", status.BAD_REQUEST);
    }

    if (!tripId) {
      return sendError(res, "Trip ID is required", status.BAD_REQUEST);
    }

    // Remove current user from participants if included
    const filteredParticipants = participantIds.filter(id => id !== userId);

    if (filteredParticipants.length === 0) {
      return sendError(res, "Cannot create chat with yourself", status.BAD_REQUEST);
    }

    const db = await database();

    // Validate that all participants exist
    const allUserIds = [...filteredParticipants, userId];
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, allUserIds));

    if (existingUsers.length !== allUserIds.length) {
      return sendError(res, "One or more participants do not exist", status.BAD_REQUEST);
    }

    // Check if trip exists
    const [trip] = await db
      .select({ id: trips.id })
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (!trip) {
      return sendError(res, "Trip not found", status.NOT_FOUND);
    }

    // Check if chat already exists between these users with same trip
    const existingChats = await db
      .select({
        chatId: chatParticipants.chatId,
      })
      .from(chatParticipants)
      .where(inArray(chatParticipants.userId, allUserIds))
      .groupBy(chatParticipants.chatId)
      .having(sql`COUNT(DISTINCT ${chatParticipants.userId}) = ${allUserIds.length}`);

    // Check each chat to see if it has exactly these participants and same trip
    for (const chatRef of existingChats) {
      const chatParticipantsList = await db
        .select({ userId: chatParticipants.userId })
        .from(chatParticipants)
        .where(eq(chatParticipants.chatId, chatRef.chatId));

      const chatUserIds = chatParticipantsList.map(p => p.userId).sort();
      const sortedUserIds = [...allUserIds].sort();

      if (chatUserIds.length === sortedUserIds.length &&
          chatUserIds.every((id, index) => id === sortedUserIds[index])) {
        // Check if same trip
        const [existingChat] = await db
          .select()
          .from(chats)
          .where(and(
            eq(chats.id, chatRef.chatId),
            eq(chats.tripId, tripId)
          ))
          .limit(1);

        if (existingChat) {
          // Return existing chat with all relations
          const chatData = await getChatWithRelations(db, existingChat.id);
          return sendSuccess(
            res,
            "Chat already exists",
            chatData,
            status.OK
          );
        }
      }
    }

    // Create new chat
    const chatId = createId();
    const [newChat] = await db
      .insert(chats)
      .values({
        id: chatId,
        tripId,
        createdBy: userId,
      })
      .returning();

    // Create participants
    const participantValues = allUserIds.map(userId => ({
      id: createId(),
      chatId,
      userId,
    }));

    await db.insert(chatParticipants).values(participantValues);

    // Get chat with all relations
    const chatData = await getChatWithRelations(db, chatId);

    return sendSuccess(
      res,
      "Chat created successfully",
      chatData,
      status.CREATED
    );
  } catch (error: any) {
    console.error("Error creating chat:", error);
    return sendError(
      res,
      error.message || "Failed to create chat",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

async function getChatWithRelations(db: any, chatId: string) {
  // Get chat
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat) return null;

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
    .where(eq(chatParticipants.chatId, chatId));

  // Get latest message
  const latestMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      chatId: messages.chatId,
      createdAt: messages.createdAt,
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
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  // Get trip details
  const [tripData] = await db
    .select({
      id: trips.id,
      title: trips.title,
    })
    .from(trips)
    .where(eq(trips.id, chat.tripId))
    .limit(1);

  return {
    ...chat,
    participants: participantsData.map((p: any) => ({
      ...p,
      user: {
        id: p.user.id,
        name: (p.user.firstName && p.user.lastName) ? `${p.user.firstName} ${p.user.lastName}` : p.user.email.split('@')[0],
        email: p.user.email,
        role: p.user.userRoles,
      },
    })),
    messages: latestMessages.map((m: any) => ({
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
}

