import { Router } from "express";
import { createChat } from "@/controllers/chat/create-chat.controller";
import { getChats } from "@/controllers/chat/get-chats.controller";
import { getChat } from "@/controllers/chat/get-chat.controller";
import { updateChat } from "@/controllers/chat/update-chat.controller";
import { deleteChat } from "@/controllers/chat/delete-chat.controller";
import { addParticipant } from "@/controllers/chat/add-participant.controller";
import { removeParticipant } from "@/controllers/chat/remove-participant.controller";
import { sendMessage } from "@/controllers/chat/send-message.controller";
import { getMessages } from "@/controllers/chat/get-messages.controller";
import { updateMessage } from "@/controllers/chat/update-message.controller";
import { deleteMessage } from "@/controllers/chat/delete-message.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const chatRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: Chat management endpoints
 */

// Chat routes
/**
 * @swagger
 * /api/chat:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get all chats
 *     description: Get all chats based on user role
 */
chatRoutes.get("/", authenticate, getChats);

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Create a new chat
 */
chatRoutes.post("/", authenticate, createChat);

/**
 * @swagger
 * /api/chat/{chatId}:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get a specific chat
 */
chatRoutes.get("/:chatId", authenticate, getChat);

/**
 * @swagger
 * /api/chat/{chatId}:
 *   put:
 *     tags:
 *       - Chat
 *     summary: Update a chat
 */
chatRoutes.put("/:chatId", authenticate, updateChat);

/**
 * @swagger
 * /api/chat/{chatId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Delete a chat
 */
chatRoutes.delete("/:chatId", authenticate, deleteChat);

// Participant routes
/**
 * @swagger
 * /api/chat/{chatId}/participants:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Add a participant to a chat
 */
chatRoutes.post("/:chatId/participants", authenticate, addParticipant);

/**
 * @swagger
 * /api/chat/{chatId}/participants/{userId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Remove a participant from a chat
 */
chatRoutes.delete(
  "/:chatId/participants/:userId",
  authenticate,
  removeParticipant
);

// Message routes
/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get messages from a chat
 */
chatRoutes.get("/:chatId/messages", authenticate, getMessages);

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a message to a chat
 */
chatRoutes.post("/:chatId/messages", authenticate, sendMessage);

/**
 * @swagger
 * /api/chat/{chatId}/messages/{messageId}:
 *   put:
 *     tags:
 *       - Chat
 *     summary: Update a message
 */
chatRoutes.put("/:chatId/messages/:messageId", authenticate, updateMessage);

/**
 * @swagger
 * /api/chat/{chatId}/messages/{messageId}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Delete a message
 */
chatRoutes.delete("/:chatId/messages/:messageId", authenticate, deleteMessage);

export default chatRoutes;
