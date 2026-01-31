import { database } from "@/configs/connection.config";
import { achievements, users, trips } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq, or, ilike, and } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/achievements/search:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: Search achievements by user name or trip title
 *     description: Search for achievements using user name or trip title. Returns matching achievements with user and trip details.
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for user name or trip title
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */
export const searchAchievements = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { query } = req.query;

    // Validate search query
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return sendError(res, "Search query is required", status.BAD_REQUEST);
    }

    const searchTerm = `%${query.trim()}%`;
    const db = await database();

    // Search achievements by user name or trip title using case-insensitive search
    const achievementsData = await db
      .select({
        // Achievement fields
        id: achievements.id,
        points: achievements.points,
        progress: achievements.progress,

        // User fields
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userNickName: users.nickName,
        userEmail: users.email,

        // Trip fields
        tripId: trips.id,
        tripTitle: trips.title,
      })
      .from(achievements)
      .leftJoin(users, eq(users.id, achievements.userId))
      .leftJoin(trips, eq(trips.id, achievements.tripId))
      .where(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.nickName, searchTerm),
          ilike(users.email, searchTerm),
          ilike(trips.title, searchTerm),
        ),
      );

    // If no achievements found, return empty array
    if (achievementsData.length === 0) {
      return sendSuccess(
        res,
        "No achievements found matching your search",
        { achievements: [] },
        status.OK,
      );
    }

    // Format the response data
    const formattedAchievements = achievementsData.map((achievement: any) => ({
      id: achievement.id,
      points: achievement.points,
      progress: achievement.progress,
      level: achievement.level,
      badges: achievement.badges,
      unlocked: achievement.unlocked,
      role: achievement.role,
      createdAt: achievement.createdAt,
      updatedAt: achievement.updatedAt,
      user: {
        id: achievement.userId,
        firstName: achievement.userFirstName,
        lastName: achievement.userLastName,
        nickName: achievement.userNickName,
        email: achievement.userEmail,
        avatar: achievement.userAvatar,
        fullName:
          achievement.userFirstName && achievement.userLastName
            ? `${achievement.userFirstName} ${achievement.userLastName}`
            : achievement.userNickName || achievement.userEmail,
      },
      trip: {
        id: achievement.tripId,
        title: achievement.tripTitle,
        description: achievement.tripDescription,
        coverImage: achievement.tripCoverImage,
        location: achievement.tripLocation,
        startDate: achievement.tripStartDate,
        endDate: achievement.tripEndDate,
        status: achievement.tripStatus,
      },
    }));

    return sendSuccess(
      res,
      `Found ${formattedAchievements.length} achievement(s) matching "${query}"`,
      {
        achievements: formattedAchievements,
        count: formattedAchievements.length,
      },
      status.OK,
    );
  } catch (error) {
    console.error("Search achievements error:", error);
    return sendError(
      res,
      "An error occurred while searching achievements",
      status.INTERNAL_SERVER_ERROR,
    );
  }
};
