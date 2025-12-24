import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { notifications } from "@/schema/schema";
import { database } from "@/configs/connection.config";
import { eq, and, sql } from "drizzle-orm";
import "@/middlewares/auth.middleware";

/**
 * Optimized mark as read notification controller
 * Uses a single UPDATE query instead of SELECT + UPDATE for better performance
 */
export const markAsReadNotificationController = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const notificationId = req.params.id;
    const userId = req.user.userId;
    const db = await database();

    const updatedNotifications = await db
      .update(notifications)
      .set({ 
        read: sql`NOT ${notifications.read}` 
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    if (updatedNotifications.length === 0) {
      return sendError(res, "Notification not found or you don't have permission", status.NOT_FOUND);
    }

    return sendSuccess(
      res, 
      "Notification status updated successfully", 
      { notification: updatedNotifications[0] }, 
      status.OK
    );
  } catch (error) {
    console.error("Mark as read notification error:", error);
    return sendError(res, "Failed to update notification", status.INTERNAL_SERVER_ERROR);
  }
};