import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, coordinatorDetails } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { or, ilike, eq, and } from "drizzle-orm";

/**
 * @swagger
 * /api/user/search:
 *   get:
 *     tags:
 *       - User
 *     summary: Search users by name or email
 *     description: Search for users using partial matches on firstName, lastName, nickName, or email. Returns all matching users with coordinator details if available.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (name or email)
 *         example: john
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, coordinator, admin]
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: Search completed successfully
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
 *                   example: Search completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           nickName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                           userRoles:
 *                             type: string
 *                           userStatus:
 *                             type: string
 *                           coordinatorDetails:
 *                             type: object
 *                             nullable: true
 *                     total:
 *                       type: integer
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
export const searchUsers = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { q, role } = req.query;

    // Handle empty search query
    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return sendSuccess(
        res,
        "Search query is empty",
        {
          users: [],
          total: 0,
        },
        status.OK,
      );
    }

    // Sanitize search query
    const searchQuery = q.trim();

    // Validate search query length
    if (searchQuery.length < 2) {
      return sendError(
        res,
        "Search query must be at least 2 characters long",
        status.BAD_REQUEST,
      );
    }

    const db = await database();

    // Build search conditions for partial matches
    const searchPattern = `%${searchQuery}%`;
    const searchConditions = or(
      ilike(users.firstName, searchPattern),
      ilike(users.lastName, searchPattern),
      ilike(users.nickName, searchPattern),
      ilike(users.email, searchPattern),
    );

    // Add role filter if provided
    let whereCondition = searchConditions;
    if (
      role &&
      typeof role === "string" &&
      ["user", "coordinator", "admin"].includes(role)
    ) {
      whereCondition = and(searchConditions, eq(users.userRoles, role));
    }

    // Fetch all matching users
    const searchResults = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        nickName: users.nickName,
        email: users.email,
        avatar: users.avatar,
        phoneNumber: users.phoneNumber,
        userRoles: users.userRoles,
        userStatus: users.userStatus,
        lastActive: users.lastActive,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        coordinatorDetailsId: users.coordinatorDetails,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(users.firstName);

    // If no results, return early
    if (searchResults.length === 0) {
      return sendSuccess(
        res,
        "No users found matching your search",
        {
          users: [],
          total: 0,
        },
        status.OK,
      );
    }

    // Fetch coordinator details for users who are coordinators
    const usersWithDetails = await Promise.all(
      searchResults.map(async (user) => {
        if (user.userRoles === "coordinator" && user.coordinatorDetailsId) {
          const coordDetails = await db
            .select({
              fullName: coordinatorDetails.fullName,
              bio: coordinatorDetails.bio,
              specialities: coordinatorDetails.specialities,
              languages: coordinatorDetails.languages,
              certificateLvl: coordinatorDetails.certificateLvl,
              yearsOfExperience: coordinatorDetails.yearsOfExperience,
              location: coordinatorDetails.location,
              successRate: coordinatorDetails.successRate,
              isActive: coordinatorDetails.isActive,
            })
            .from(coordinatorDetails)
            .where(eq(coordinatorDetails.userId, user.id))
            .limit(1);

          return {
            ...user,
            coordinatorDetails: coordDetails[0] || null,
          };
        }
        return {
          ...user,
          coordinatorDetails: null,
        };
      }),
    );

    return sendSuccess(
      res,
      "Search completed successfully",
      {
        users: usersWithDetails,
        total: usersWithDetails.length,
      },
      status.OK,
    );
  } catch (error) {
    console.error("Search users error:", error);
    return sendError(
      res,
      "An error occurred while searching users",
      status.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
