import { database } from "@/configs/connection.config";
import { achievements, trips, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/coordinator/achievements:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: Get all achievements
 *     description: Retrieve all achievements across all users. Provides admin/coordinator view of all user achievements and progress. Requires coordinator or admin role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Achievements fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Achievement"
 *                   description: Array of all achievement records across all users
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Coordinator or Admin role required
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
export const getAllAchievements = async (_req: Request, res: Response) => {
  try {
    const db = await database();
    const achievementsWithUsers = await db
      .select({
          achievement: achievements,
          trip: {
            id: trips.id,
            title: trips.title,
          },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(achievements)
      .innerJoin(users, eq(achievements.userId, users.id))
      .innerJoin(trips, eq(achievements.tripId, trips.id));


    // Transform data to include user object along with achievement data
  // optional: flatten response
    const response = achievementsWithUsers.map(({ achievement, user, trip }) => ({
      ...achievement,
        user,
      trip,
    }));
    return sendSuccess(res, "Achievements fetched successfully", response);
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      "Internal server error",
      status.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * Internal service function - not exposed as an endpoint
 * Achievements are automatically tracked when applications are approved via updateApplication controller
 */
export const trackUserAchievements = async (payload: {
  userId: string;
  tripId: string;
  points: number;
  level: string;
  badges: string;
  progress: number;
}) => {
  try {
    const db = await database();
    const achievement = await db.insert(achievements).values({
      userId: payload.userId,
      tripId: payload.tripId,
      points: payload.points,
      level: payload.level,
      badges: payload.badges as
        | "Mountain Climber"
        | "Culture Explorer"
        | "Nature Lover"
        | "Leader",
      progress: payload.progress,
    });
    return achievement;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
