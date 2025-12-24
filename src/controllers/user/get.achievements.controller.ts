import { Request, Response } from "express";
import { sendError, sendSuccess } from "@/utils/response.util";
import { getUserAchievements } from "@/services/achievement.service";
import status from "http-status";
import "@/middlewares/auth.middleware";

/**
 * @swagger
 * /api/user/achievements:
 *   get:
 *     tags:
 *       - User
 *       - Achievements
 *     summary: Get user achievements
 *     description: Retrieve all achievements and progress for the authenticated user. Shows progress toward badges (Mountain Climber, Culture Explorer, Nature Lover, Leader) and unlocked badges.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/UserAchievementsResponse"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export const getUserAchievementsController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const userId = req.user.userId;
    const achievementsData = await getUserAchievements(userId);

    return sendSuccess(
      res,
      "Achievements retrieved successfully",
      achievementsData,
      status.OK
    );
  } catch (error) {
    console.error("Get user achievements error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to retrieve achievements",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

