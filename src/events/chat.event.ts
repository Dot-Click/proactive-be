import { SocketEventHandler } from "@/types/socket";
import { database } from "@/configs/connection.config";
import { messages, chats } from "@/schema/schema";
import { sendMessageSchema } from "@/types/chat.types";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import {
  emitToChatRoom,
  getMessageWithSender,
  verifyChatParticipant,
} from "@/utils/socket-chat.util";

interface JoinChatData {
chatId: string;
}

interface SendMessageData {
  chatId: string;
  content: string;
}

/**
 * Handle joining a chat room
 */
export const joinChatHandler: SocketEventHandler<JoinChatData> = async ({
  socket,
  chatId,
}) => {
  try {
    if (!socket.data.userId) {
      socket.emit("error", { message: "Authentication required" });
      return;
    }

    const userId = socket.data.userId;
    const db = await database();

    // Verify chat exists
    const chatResults = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chatResults.length === 0) {
      socket.emit("error", { message: "Chat not found" });
      return;
    }

    // Verify user is a participant (or admin)
    const isParticipant = await verifyChatParticipant(chatId, userId);
    if (!isParticipant && socket.data.role !== "admin") {
      socket.emit("error", {
        message: "You are not a participant in this chat",
      });
      return;
    }

    // Join chat room
    await socket.join(`chat:${chatId}`);
    await socket.join(`user:${userId}`);

    socket.emit("chat:joined", { chatId });
  } catch (error) {
    console.error("Join chat error:", error);
    socket.emit("error", { message: "Failed to join chat" });
  }
};

/**
 * Handle leaving a chat room
 */
export const leaveChatHandler: SocketEventHandler<JoinChatData> = async ({
  socket,
  chatId,
}) => {
  try {
    await socket.leave(`chat:${chatId}`);
    socket.emit("chat:left", { chatId });
  } catch (error) {
    console.error("Leave chat error:", error);
    socket.emit("error", { message: "Failed to leave chat" });
  }
};

/**
 * Handle sending a message via socket
 */
export const sendMessageHandler: SocketEventHandler<SendMessageData> = async ({
  socket,
  chatId,
  content,
  io,
}) => {
  try {
    if (!socket.data.userId) {
      socket.emit("error", { message: "Authentication required" });
      return;
    }

    const userId = socket.data.userId;
    const db = await database();

    // Validate input
    const validationResult = sendMessageSchema.safeParse({ chatId, content });
    if (!validationResult.success) {
      socket.emit("error", {
        message: "Validation failed",
        errors: validationResult.error.errors,
      });
      return;
    }

    // Verify chat exists
    const chatResults = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (chatResults.length === 0) {
      socket.emit("error", { message: "Chat not found" });
      return;
    }

    // Verify user is a participant (or admin)
    const isParticipant = await verifyChatParticipant(chatId, userId);
    if (!isParticipant && socket.data.role !== "admin") {
      socket.emit("error", {
        message: "You must be a participant to send messages",
      });
      return;
    }

    // Create message
    const newMessage = await db
      .insert(messages)
      .values({
        id: createId(),
        chatId,
        senderId: userId,
        content,
      })
      .returning();

    // Get message with sender details
    const messageWithSender = await getMessageWithSender(newMessage[0].id);

    if (!messageWithSender) {
      socket.emit("error", { message: "Failed to retrieve message" });
      return;
    }

    // Emit to all chat participants
    if (io) {
      await emitToChatRoom(io, chatId, "message:new", {
        message: messageWithSender,
      });
    }

    socket.emit("message:sent", { message: messageWithSender });
  } catch (error) {
    console.error("Send message error:", error);
    socket.emit("error", { message: "Failed to send message" });
  }
};
