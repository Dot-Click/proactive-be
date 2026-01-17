import { database } from "@/configs/connection.config";
import { achievements, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

export const getuserSettings = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.user?.userId!
        console.log(id)
        const db = await database()
        const userSettings = await db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            nickName: users.nickName,
            dob: users.dob,
            gender: users.address,
            avatar: users.avatar,
            
            achievementId: achievements.id,
            points: achievements.points,
            badge: achievements.badges,
            level: achievements.level,
            progress: achievements.progress,
            unlocked: achievements.unlocked,
        }).from(users).leftJoin(achievements, eq(achievements.userId, users.id))
        .where(eq(users.id, id!))
        .limit(1);
        return sendSuccess(res, "user settings retrived", userSettings, status.OK)
    } catch (error) {
        console.log(error)
        return sendError(res, "server error", status.INTERNAL_SERVER_ERROR)
    }
}

export const deleteAuthUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const id = req.user?.userId
        const db = await database()
        const del = await db.delete(users).where(eq(users.id, id!)).returning();

        return sendSuccess(res, "userDeleted", del, status.OK)
    } catch (error) {
        return sendError(res, "server error", status.INTERNAL_SERVER_ERROR)
    }
}