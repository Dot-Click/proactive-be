import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { notifications } from "@/schema/schema";
import { database } from "@/configs/connection.config";
import { and, eq } from "drizzle-orm";
import "@/middlewares/auth.middleware";

export const markAllNotificationsAsReadController = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!req.user) {
            return sendError(res, "Authentication required", status.UNAUTHORIZED);
        }

        const userId = req.user.userId;
        const db = await database();

        await db
            .update(notifications)
            .set({ read: true })
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.read, false)
                )
            );

        return sendSuccess(
            res,
            "All notifications marked as read",
            {},
            status.OK
        );
    } catch (error) {
        console.error("Mark all as read error:", error);
        return sendError(res, "Failed to update notifications", status.INTERNAL_SERVER_ERROR);
    }
};
