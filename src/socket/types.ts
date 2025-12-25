import { Socket } from "socket.io";

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  chatId: string;
  createdAt: Date;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: Date;
}


export interface SocketEvents {
  // Client to Server
  join_chat: (data: { chatId: string }) => void;
  leave_chat: (data: { chatId: string }) => void;
  send_message: (data: { chatId: string; content: string }) => void;
  typing_start: (data: { chatId: string }) => void;
  typing_stop: (data: { chatId: string }) => void;
  mark_as_read: (data: { chatId: string; messageId: string }) => void;
  
  // Server to Client
  message_received: (message: ChatMessage) => void;
  message_delivered: (data: { messageId: string; chatId: string }) => void;
  user_typing: (data: { userId: string; chatId: string; isTyping: boolean }) => void;
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string }) => void;
  chat_joined: (data: { chatId: string }) => void;
  chat_left: (data: { chatId: string }) => void;
  error: (error: { message: string; code?: string }) => void;
}

export interface JoinChatData {
  chatId: string;
}

export interface SendMessageData {
  chatId: string;
  content: string;
}

export interface TypingData {
  chatId: string;
}

export interface MarkAsReadData {
  chatId: string;
  messageId: string;
}
