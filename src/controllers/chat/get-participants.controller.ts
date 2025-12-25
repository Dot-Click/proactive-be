import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chatParticipants, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { eq, and } from "drizzle-orm";

export const getParticipants = async (
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
      return sendError(res, "You are not a participant of this chat", status.FORBIDDEN);
    }

    // Get all participants
    const participantsData = await db
      .select({
        id: chatParticipants.id,
        userId: chatParticipants.userId,
        role: chatParticipants.role,
        joinedAt: chatParticipants.joinedAt,
        createdAt: chatParticipants.createdAt,
        updatedAt: chatParticipants.updatedAt,
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

    const formattedParticipants = participantsData.map(p => ({
      id: p.id,
      userId: p.userId,
      role: p.role,
      joinedAt: p.joinedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      user: {
        id: p.user.id,
        name: (p.user.firstName && p.user.lastName) ? `${p.user.firstName} ${p.user.lastName}` : p.user.email.split('@')[0],
        email: p.user.email,
        role: p.user.userRoles,
      },
    }));

    return sendSuccess(
      res,
      "Participants retrieved successfully",
      formattedParticipants,
      status.OK
    );
  } catch (error: any) {
    console.error("Error getting participants:", error);
    return sendError(
      res,
      error.message || "Failed to get participants",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

