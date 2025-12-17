import { IO } from "@/types/socket";
import { database } from "@/configs/connection.config";
import { chatParticipants, messages, users } from "@/schema/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Get all participant user IDs for a chat
 */
export const getChatParticipantIds = async (
  chatId: string
): Promise<string[]> => {
  const db = await database();
  const participants = await db
    .select({ userId: chatParticipants.userId })
    .from(chatParticipants)
    .where(eq(chatParticipants.chatId, chatId));

  return participants.map((p) => p.userId);
};

/**
 * Emit message to all participants in a chat room
 */
export const emitToChatRoom = async (
  io: IO,
  chatId: string,
  event: string,
  data: any
): Promise<void> => {
  const participantIds = await getChatParticipantIds(chatId);
  
  // Emit to all participants
  participantIds.forEach((userId) => {
    io.to(`user:${userId}`).emit(event, data);
  });
  
  // Also emit to the chat room
  io.to(`chat:${chatId}`).emit(event, data);
};

/**
 * Get message with sender details
 */
export const getMessageWithSender = async (messageId: string) => {
  const db = await database();
  const messageResults = await db
    .select({
      id: messages.id,
      chatId: messages.chatId,
      senderId: messages.senderId,
      senderFirstName: users.FirstName,
      senderLastName: users.LastName,
      senderEmail: users.email,
      // senderProfilePic: users.profilePic,
      content: messages.content,
      editedAt: messages.editedAt,
      createdAt: messages.createdAt,
      updatedAt: messages.updatedAt,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
    .limit(1);

  return messageResults[0] || null;
};

/**
 * Verify user is a participant in a chat
 */
export const verifyChatParticipant = async (
  chatId: string,
  userId: string
): Promise<boolean> => {
  const db = await database();
  const participantResults = await db
    .select()
    .from(chatParticipants)
    .where(
      and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      )
    )
    .limit(1);

  return participantResults.length > 0;
};


