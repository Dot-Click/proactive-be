import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { chats, chatParticipants, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { createChatSchema } from "@/types/chat.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { createNotification } from "@/services/notifications.services";

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Create a new chat
 *     description: Create a new group chat with participants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - coordinatorId
 *               - participantIds
 *             properties:
 *               name:
 *                 type: string
 *                 example: Trip to Paris
 *               description:
 *                 type: string
 *                 example: Group chat for Paris trip participants
 *               coordinatorId:
 *                 type: string
 *                 example: coord123
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user1", "user2"]
 *     responses:
 *       201:
 *         description: Chat created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Coordinator or participant not found
 *       500:
 *         description: Internal server error
 */
export const createChat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const validationResult = createChatSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        errors
      );
    }

    const { name, description, coordinatorId, participantIds } =
      validationResult.data;
    const db = await database();

    // Verify coordinator exists and is a coordinator
    const coordinatorResults = await db
      .select()
      .from(users)
      .where(
        and(eq(users.id, coordinatorId), eq(users.userRoles, "coordinator"))
      )
      .limit(1);

    if (coordinatorResults.length === 0) {
      return sendError(
        res,
        "Coordinator not found or invalid",
        status.NOT_FOUND
      );
    }

    // Verify all participants exist and are users
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.userRoles, "user"));

    const validParticipantIds = allUsers
      .filter((user) => participantIds.includes(user.id))
      .map((user) => user.id);

    if (validParticipantIds.length !== participantIds.length) {
      return sendError(
        res,
        "One or more participants not found or invalid",
        status.NOT_FOUND
      );
    }

    // Create chat
    const newChat = await db
      .insert(chats)
      .values({
        id: createId(),
        name,
        description: description || null,
        coordinatorId,
        createdBy: req.user.userId,
      })
      .returning({
        id: chats.id,
        name: chats.name,
        description: chats.description,
        coordinatorId: chats.coordinatorId,
        createdBy: chats.createdBy,
        createdAt: chats.createdAt,
      });

    const chat = newChat[0];

    // Add coordinator as participant with admin role
    await db.insert(chatParticipants).values({
      id: createId(),
      chatId: chat.id,
      userId: coordinatorId,
      role: "admin",
    });

    // Add creator as participant if not coordinator
    if (req.user.userId !== coordinatorId) {
      await db.insert(chatParticipants).values({
        id: createId(),
        chatId: chat.id,
        userId: req.user.userId,
        role: req.user.role === "admin" ? "admin" : "participant",
      });
    }

    // Add all participants
    const participantInserts = validParticipantIds.map((userId) => ({
      id: createId(),
      chatId: chat.id,
      userId,
      role: "participant" as const,
    }));

    if (participantInserts.length > 0) {
      await db.insert(chatParticipants).values(participantInserts);
    }
    // send notf to all participants
    for (const userId of validParticipantIds) {
      await createNotification({
        userId: userId,
        title: "You are added to a new chat",
        description: `You are added to a new chat ${chat.name}`,
        type: "chat",
      });
    }
    return sendSuccess(
      res,
      "Chat created successfully",
      { chat },
      status.CREATED
    );
  } catch (error) {
    console.error("Create chat error:", error);
    return sendError(
      res,
      "An error occurred while creating chat",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

