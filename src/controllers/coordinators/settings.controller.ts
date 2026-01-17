import { database } from "@/configs/connection.config"
import { coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Response, Request } from "express"
import status from "http-status";



/**
 * @swagger
 * /api/coordinator/settings:
 *   get:
 *     tags:
 *       - Coordinator
 *     summary: Get coordinator settings
 *     description: Get coordinator settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       500:
 *         description: Internal server error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * */
export const settings = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.userId
        const db = await database();
        const settings = await db.select({
            id: users.id,
            fname: coordinatorDetails.fullName,
            avatar: coordinatorDetails.profilePicture,
            emai: users.email,
            notificationPref: coordinatorDetails.notificationPref
        }).from(users)
        .leftJoin(coordinatorDetails,eq(coordinatorDetails.id, users.coordinatorDetails))
        .where(eq(users.id, userId!)).limit(1);
        return sendSuccess(res, "info retrived", settings, status.OK)
    } catch (error) {
        console.log(error)
        return sendError(res, "server error", status.INTERNAL_SERVER_ERROR)
    }
}