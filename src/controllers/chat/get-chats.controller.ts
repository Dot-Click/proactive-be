import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants, users, messages, trips } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { eq, desc, inArray } from "drizzle-orm";

export const getChats = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return sendError(res, "Invalid pagination parameters", status.BAD_REQUEST);
    }

    const db = await database();
    const skip = (page - 1) * limit;

    // Check if user is admin
    const isAdmin = req.user.role === "admin";

    let chatsList;
    
    if (isAdmin) {
      // Admin can see all chats
      chatsList = await db
        .select()
        .from(chats)
        .orderBy(desc(chats.updatedAt))
        .limit(limit)
        .offset(skip);
    } else {
      // Regular users only see chats where they are a participant
      const userChats = await db
        .select({
          chatId: chatParticipants.chatId,
        })
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, userId));

      const chatIds = userChats.map(c => c.chatId);

      if (chatIds.length === 0) {
        return sendSuccess(res, "Chats retrieved successfully", [], status.OK);
      }

      // Get chats with pagination
      chatsList = await db
        .select()
        .from(chats)
        .where(inArray(chats.id, chatIds))
        .orderBy(desc(chats.updatedAt))
        .limit(limit)
        .offset(skip);
    }

    // Get all data for each chat
    const chatsWithData = await Promise.all(
      chatsList.map(async (chat) => {
        // Get participants
        const participantsData = await db
          .select({
            id: chatParticipants.id,
            userId: chatParticipants.userId,
            role: chatParticipants.role,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              userRoles: users.userRoles,
              profilePicture: users.avatar,
              avatar: users.avatar,
            },
          })
          .from(chatParticipants)
          .innerJoin(users, eq(chatParticipants.userId, users.id))
          .where(eq(chatParticipants.chatId, chat.id));

        // Get latest message
        const [latestMessage] = await db
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
          .where(eq(messages.chatId, chat.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Get trip
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

        // Format participants array for frontend
        const participants = participantsData.map(p => ({
          id: p.id,
          userId: p.userId,
          role: p.role,
          user: {
            id: p.user.id,
            fullName: (p.user.firstName && p.user.lastName) 
              ? `${p.user.firstName} ${p.user.lastName}` 
              : p.user.email.split('@')[0],
            name: (p.user.firstName && p.user.lastName) 
              ? `${p.user.firstName} ${p.user.lastName}` 
              : p.user.email.split('@')[0],
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            email: p.user.email,
            type: p.user.userRoles,
            profilePicture: p.user.avatar,
            avatar: p.user.avatar,
          }
        }));

        return {
          id: chat.id,
          user: participantsData.find(p => p.user.userRoles === "user")?.user ? {
            id: participantsData.find(p => p.user.userRoles === "user")!.user.id,
            name: participantsData.find(p => p.user.userRoles === "user")!.user.firstName && participantsData.find(p => p.user.userRoles === "user")!.user.lastName
              ? `${participantsData.find(p => p.user.userRoles === "user")!.user.firstName} ${participantsData.find(p => p.user.userRoles === "user")!.user.lastName}`
              : participantsData.find(p => p.user.userRoles === "user")!.user.email.split('@')[0],
            email: participantsData.find(p => p.user.userRoles === "user")!.user.email,
            role: participantsData.find(p => p.user.userRoles === "user")!.user.userRoles,
          } : null,
          coordinator: participantsData.find(p => p.user.userRoles === "coordinator")?.user ? {
            id: participantsData.find(p => p.user.userRoles === "coordinator")!.user.id,
            name: participantsData.find(p => p.user.userRoles === "coordinator")!.user.firstName && participantsData.find(p => p.user.userRoles === "coordinator")!.user.lastName
              ? `${participantsData.find(p => p.user.userRoles === "coordinator")!.user.firstName} ${participantsData.find(p => p.user.userRoles === "coordinator")!.user.lastName}`
              : participantsData.find(p => p.user.userRoles === "coordinator")!.user.email.split('@')[0],
            email: participantsData.find(p => p.user.userRoles === "coordinator")!.user.email,
            role: participantsData.find(p => p.user.userRoles === "coordinator")!.user.userRoles,
          } : null,
          participants: participants,
          trip: tripData,
          lastMessage: latestMessage ? {
            ...latestMessage,
            sender: {
              id: latestMessage.sender.id,
              name: (latestMessage.sender.firstName && latestMessage.sender.lastName)
                ? `${latestMessage.sender.firstName} ${latestMessage.sender.lastName}`
                : latestMessage.sender.email.split('@')[0],
              email: latestMessage.sender.email,
              role: latestMessage.sender.userRoles,
            },
          } : null,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        };
      })
    );

    return sendSuccess(
      res,
      "Chats retrieved successfully",
      chatsWithData,
      status.OK
    );
  } catch (error: any) {
    console.error("Error getting chats:", error);
    return sendError(
      res,
      error.message || "Failed to get chats",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

