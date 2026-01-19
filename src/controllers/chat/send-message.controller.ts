import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { messages, chatParticipants, chats, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";
import { eq, and } from "drizzle-orm";

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!content || !content.trim()) {
      return sendError(res, "Message content is required", status.BAD_REQUEST);
    }

    const db = await database();

    if (userRole !== "admin") {
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

    // Create message
    const [newMessage] = await db
      .insert(messages)
      .values({
        id: createId(),
        content: content.trim(),
        chatId: id,
        senderId: userId,
      })
      .returning();

    // Update chat's updatedAt
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, id));

    // Get sender details
    const [sender] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const messageData = {
      ...newMessage,
      sender: {
        id: sender.id,
        name: (sender.firstName && sender.lastName) ? `${sender.firstName} ${sender.lastName}` : sender.email.split('@')[0],
        email: sender.email,
      },
    };

    return sendSuccess(
      res,
      "Message sent successfully",
      messageData,
      status.CREATED
    );
  } catch (error: any) {
    console.error("Error sending message:", error);
    return sendError(
      res,
      error.message || "Failed to send message",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
