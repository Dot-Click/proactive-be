import { Router } from "express";
import { createChat } from "@/controllers/chat/create-chat.controller";
import { getChats } from "@/controllers/chat/get-chats.controller";
import { getChat } from "@/controllers/chat/get-chat.controller";
import { deleteChat } from "@/controllers/chat/delete-chat.controller";
import { getParticipants } from "@/controllers/chat/get-participants.controller";
import { sendMessage } from "@/controllers/chat/send-message.controller";
import { getMessages } from "@/controllers/chat/get-messages.controller";
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
 * /api/chat/{id}:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get a specific chat
 */
chatRoutes.get("/:id", authenticate, getChat);

/**
 * @swagger
 * /api/chat/{id}:
 *   delete:
 *     tags:
 *       - Chat
 *     summary: Delete a chat
 */
chatRoutes.delete("/:id", authenticate, deleteChat);

// Participant routes
/**
 * @swagger
 * /api/chat/{id}/participants:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get chat participants
 */
chatRoutes.get("/:id/participants", authenticate, getParticipants);

// Message routes
/**
 * @swagger
 * /api/chat/{id}/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get messages from a chat
 */
chatRoutes.get("/:id/messages", authenticate, getMessages);

/**
 * @swagger
 * /api/chat/{id}/messages:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a message to a chat
 */
chatRoutes.post("/:id/messages", authenticate, sendMessage);


export default chatRoutes;
