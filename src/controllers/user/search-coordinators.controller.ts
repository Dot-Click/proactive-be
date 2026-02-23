import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, coordinatorDetails } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { or, ilike, eq, and } from "drizzle-orm";

/**
 * @swagger
 * /api/user/search-coordinators:
 *   get:
 *     tags:
 *       - User
 *     summary: Search coordinators by name or email
 *     description: Search for coordinators using partial matches on firstName, lastName, nickName, or email. Returns all matching coordinators with their coordinator details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (name or email)
 *         example: sarah
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
 *                     coordinators:
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
 *                           phoneNumber:
 *                             type: string
 *                           userStatus:
 *                             type: string
 *                           coordinatorDetails:
 *                             type: object
 *                             properties:
 *                               fullName:
 *                                 type: string
 *                               bio:
 *                                 type: string
 *                               specialities:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               languages:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               certificateLvl:
 *                                 type: string
 *                               yearsOfExperience:
 *                                 type: integer
 *                               location:
 *                                 type: string
 *                               successRate:
 *                                 type: string
 *                               isActive:
 *                                 type: boolean
 *                     total:
 *                       type: integer
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
export const searchCoordinators = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { q } = req.query;

    // Handle empty search query
    if (!q || typeof q !== "string" || q.trim().length === 0) {
      return sendSuccess(
        res,
        "Search query is empty",
        {
          coordinators: [],
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
    const searchConditions = and(
      or(
        ilike(users.firstName, searchPattern),
        ilike(users.lastName, searchPattern),
        ilike(users.nickName, searchPattern),
        ilike(users.email, searchPattern),
      ),
      eq(users.userRoles, "coordinator"),
    );

    // Fetch all matching coordinators
    const searchResults = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        nickName: users.nickName,
        email: users.email,
        avatar: users.avatar,
        phoneNumber: users.phoneNumber,
        userStatus: users.userStatus,
        lastActive: users.lastActive,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        coordinatorDetailsId: users.coordinatorDetails,
      })
      .from(users)
      .where(searchConditions)
      .orderBy(users.firstName);

    // If no results, return early
    if (searchResults.length === 0) {
      return sendSuccess(
        res,
        "No coordinators found matching your search",
        {
          coordinators: [],
          total: 0,
        },
        status.OK,
      );
    }

    // Fetch coordinator details for all coordinators
    const coordinatorsWithDetails = await Promise.all(
      searchResults.map(async (coordinator) => {
        if (coordinator.coordinatorDetailsId) {
          const coordDetails = await db
            .select({
              id: coordinatorDetails.id,
              fullName: coordinatorDetails.fullName,
              bio: coordinatorDetails.bio,
              specialities: coordinatorDetails.specialities,
              languages: coordinatorDetails.languages,
              certificateLvl: coordinatorDetails.certificateLvl,
              yearsOfExperience: coordinatorDetails.yearsOfExperience,
              location: coordinatorDetails.location,
              successRate: coordinatorDetails.successRate,
              isActive: coordinatorDetails.isActive,
              profilePicture: coordinatorDetails.profilePicture,
            })
            .from(coordinatorDetails)
            .where(eq(coordinatorDetails.userId, coordinator.id))
            .limit(1);

          return {
            ...coordinator,
            coordinatorDetails: coordDetails[0] || null,
          };
        }
        return {
          ...coordinator,
          coordinatorDetails: null,
        };
      }),
    );

    return sendSuccess(
      res,
      "Search completed successfully",
      {
        coordinators: coordinatorsWithDetails,
        total: coordinatorsWithDetails.length,
      },
      status.OK,
    );
  } catch (error) {
    console.error("Search coordinators error:", error);
    return sendError(
      res,
      "An error occurred while searching coordinators",
      status.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
};
