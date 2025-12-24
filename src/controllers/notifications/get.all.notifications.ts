import { database } from "@/configs/connection.config";
import { notifications } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { desc, eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

export const getAllNotificationsController = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = await database();
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }
    const notfs = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    return sendSuccess(res, "Notifications fetched successfully", notfs, status.OK);
  } catch (error) {
    console.error("Get all notifications error:", error);
    return sendError(res, "Failed to get all notifications", status.INTERNAL_SERVER_ERROR);
  }
};