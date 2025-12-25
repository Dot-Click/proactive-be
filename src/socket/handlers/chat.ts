import { AuthenticatedSocket, SendMessageData, TypingData, MarkAsReadData } from "../types";
import { chatParticipants } from "../../schema/schema";
import { eq, and } from "drizzle-orm";
import { database } from "@/configs/connection.config";

// Store typing users per chat
const typingUsers = new Map<string, Set<string>>(); // chatId -> Set of userIds

export const handleJoinChat = async (socket: AuthenticatedSocket, data: { chatId: string }) => {
  try {
    const userId = socket.user!.id;
    const { chatId } = data;

    // Verify user is participant of this chat
    const db = await database();
    const chatParticipant = await db
      .select()
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ))
      .limit(1);

    if (chatParticipant.length === 0) {
      socket.emit('error', { message: 'You are not a participant of this chat', code: 'NOT_PARTICIPANT' });
      return;
    }

    // Join the socket room
    await socket.join(`chat_${chatId}`);
    
    // Emit confirmation
    socket.emit('chat_joined', { chatId });
    
    console.log(`User ${socket.user?.email} joined chat ${chatId}`);
  } catch (error) {
    console.error('Error joining chat:', error);
    socket.emit('error', { message: 'Failed to join chat' });
  }
};

export const handleLeaveChat = async (socket: AuthenticatedSocket, data: { chatId: string }) => {
  try {
    const { chatId } = data;

    // Leave the socket room
    await socket.leave(`chat_${chatId}`);
    
    // Remove from typing users
    const chatTypingUsers = typingUsers.get(chatId);
    if (chatTypingUsers) {
      chatTypingUsers.delete(socket.user!.id);
      if (chatTypingUsers.size === 0) {
        typingUsers.delete(chatId);
      }
    }
    
    // Emit confirmation
    socket.emit('chat_left', { chatId });
    
    console.log(`User ${socket.user?.email} left chat ${chatId}`);
  } catch (error) {
    console.error('Error leaving chat:', error);
    socket.emit('error', { message: 'Failed to leave chat' });
  }
};

export const handleSendMessage = async (socket: AuthenticatedSocket, data: SendMessageData) => {
  try {
    const userId = socket.user!.id;
    const { chatId, content } = data;

    // Validate input
    if (!content.trim()) {
      socket.emit('error', { message: 'Message content cannot be empty' });
      return;
    }

    // Verify user is participant of this chat
    const db = await database();
    const chatParticipant = await db
      .select()
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ))
      .limit(1);

    if (chatParticipant.length === 0) {
      socket.emit('error', { message: 'You are not a participant of this chat', code: 'NOT_PARTICIPANT' });
      return;
    }


    const { messages, users, chats } = await import("../../schema/schema");
    const { createId } = await import("@paralleldrive/cuid2");
    
    const [message] = await db
      .insert(messages)
      .values({
        id: createId(),
        content: content.trim(),
        chatId,
        senderId: userId,
      })
      .returning();

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


    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    const messageData = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      chatId: message.chatId,
      createdAt: message.createdAt,
      sender: {
        id: sender.id,
        name: sender.firstName && sender.lastName ? `${sender.firstName} ${sender.lastName}` : sender.email.split('@')[0],
        email: sender.email,
      },
    };


    socket.to(`chat_${chatId}`).emit('message_received', messageData);
    
    socket.emit('message_received', messageData);

    socket.emit('message_delivered', {
      messageId: message.id,
      chatId: message.chatId,
    });

    console.log(`Message sent by ${socket.user?.email} in chat ${chatId}`);
  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

export const handleTypingStart = async (socket: AuthenticatedSocket, data: TypingData) => {
  try {
    const userId = socket.user!.id;
    const { chatId } = data;

    // Verify user is participant of this chat
    const db = await database();
    const chatParticipant = await db
      .select()
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ))
      .limit(1);

    if (chatParticipant.length === 0) {
      return;
    }

    // Add user to typing users
    if (!typingUsers.has(chatId)) {
      typingUsers.set(chatId, new Set());
    }
    typingUsers.get(chatId)!.add(userId);

    // Notify other participants
    socket.to(`chat_${chatId}`).emit('user_typing', {
      userId,
      chatId,
      isTyping: true,
    });
  } catch (error) {
    console.error('Error handling typing start:', error);
  }
};

export const handleTypingStop = async (socket: AuthenticatedSocket, data: TypingData) => {
  try {
    const userId = socket.user!.id;
    const { chatId } = data;

    // Remove user from typing users
    const chatTypingUsers = typingUsers.get(chatId);
    if (chatTypingUsers) {
      chatTypingUsers.delete(userId);
      if (chatTypingUsers.size === 0) {
        typingUsers.delete(chatId);
      }
    }

    // Notify other participants
    socket.to(`chat_${chatId}`).emit('user_typing', {
      userId,
      chatId,
      isTyping: false,
    });
  } catch (error) {
    console.error('Error handling typing stop:', error);
  }
};

export const handleMarkAsRead = async (socket: AuthenticatedSocket, data: MarkAsReadData) => {
  try {
    const userId = socket.user!.id;
    const { chatId, messageId } = data;

    const db = await database();
    const chatParticipant = await db
      .select()
      .from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ))
      .limit(1);

    if (chatParticipant.length === 0) {
      socket.emit('error', { message: 'You are not a participant of this chat', code: 'NOT_PARTICIPANT' });
      return;
    }

    // Here you could implement read receipts if needed
    // For now, just acknowledge the action
    console.log(`User ${socket.user?.email} marked message ${messageId} as read in chat ${chatId}`);
  } catch (error) {
    console.error('Error marking message as read:', error);
    socket.emit('error', { message: 'Failed to mark message as read' });
  }
};
