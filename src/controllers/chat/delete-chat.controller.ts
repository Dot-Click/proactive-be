import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { eq, and } from "drizzle-orm";

export const deleteChat = async (
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

    // Delete chat (cascade will handle participants and messages)
    await db
      .delete(chats)
      .where(eq(chats.id, id));

    return sendSuccess(
      res,
      "Chat deleted successfully",
      undefined,
      status.OK
    );
  } catch (error: any) {
    console.error("Error deleting chat:", error);
    return sendError(
      res,
      error.message || "Failed to delete chat",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

