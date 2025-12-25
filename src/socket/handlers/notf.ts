import { AuthenticatedSocket } from "../types";
import { chats, chatParticipants, notifications, users } from "../../schema/schema";
import { eq, and, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { database } from "@/configs/connection.config";

export const handleSendNotification = async (socket: AuthenticatedSocket, data: { title: string, chatId: string, description: string, type: string }) => {
  try {
    const senderId = socket.user!.id;
    const { title, chatId, description, type } = data;
    
    const db = await database();

    // Get chat with participants
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Get all participants
    const participantsData = await db
      .select({
        userId: chatParticipants.userId,
      })
      .from(chatParticipants)
      .where(eq(chatParticipants.chatId, chatId));

    const otherParticipants = participantsData.filter(participant => participant.userId !== senderId);
    
    const notificationsList = [];
    for (const participant of otherParticipants) {
      const [notification] = await db
        .insert(notifications)
        .values({
          id: createId(),
          userId: participant.userId,
          title,
          description,
          type,
        })
        .returning();
      
      notificationsList.push({ notification, userId: participant.userId });
    }

    // Emit notifications to connected sockets
    const io = (socket as any).server;
    for (const { notification, userId } of notificationsList) {
      const userSockets = Array.from(io.sockets.sockets.values())
        .filter((s: any) => s.user?.id === userId);
      
      console.log(`Emitting notification to user ${userId}, found ${userSockets.length} sockets`);
      
      userSockets.forEach((userSocket: any) => {
        userSocket.emit('notification', notification);
      });
    }
    
    console.log(`Notifications sent to ${otherParticipants.length} participants`);
  } catch (error) {
    console.error('Error sending notification:', error);
    socket.emit('error', { message: 'Failed to send notification' });
  }
};

export const handleGetNotifications = async (socket: AuthenticatedSocket, _data?: { userId?: string }) => {
  try {
    const userId = socket.user!.id;
    const db = await database();
    
    const notificationsList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    socket.emit('notifications', notificationsList);
  } catch (error) {
    console.error('Error getting notifications:', error);
    socket.emit('error', { message: 'Failed to get notifications' });
  }
};

export const handleMarkNotificationAsRead = async (socket: AuthenticatedSocket, data: { notificationId: string }) => {
  try {
    const userId = socket.user!.id;
    const { notificationId } = data;
    const db = await database();
    
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();

    if (notification) {
      socket.emit('notification_marked_as_read', notification);
    } else {
      socket.emit('error', { message: 'Notification not found or access denied' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    socket.emit('error', { message: 'Failed to mark notification as read' });
  }
};

