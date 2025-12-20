import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { coordinatorDetails, users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user
 *     description: Get the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                   example: User information retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         name:
 *                           type: string
 *                         alias:
 *                           type: string
 *                         fullHomeAddress:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         gender:
 *                           type: string
 *                         specialDiet:
 *                           type: string
 *                           enum: [vegetarian, vegan, gluten-free, other]
 *                         specialDietOther:
 *                           type: string
 *                         profilePic:
 *                           type: string
 *                         role:
 *                           type: string
 *                         emailVerified:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const db = await database();

    // Get user from database
    const userResults = await db
      .select({
        id: users.id,
        email: users.email,
        FirstName: users.firstName,
        LastName: users.lastName,
        NickName: users.nickName,
        Address: users.address,
        PhoneNumber: users.phoneNumber,
        Gender: users.gender,
        userRoles: users.userRoles,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (userResults.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    const user = userResults[0];

    // Fetch coordinator details if user is a coordinator
    let coordDetails = null;
    if (user.userRoles === "coordinator") {
      const coordDetailsResults = await db
        .select()
        .from(coordinatorDetails)
        .where(eq(coordinatorDetails.userId, user.id))
        .limit(1);
      
      if (coordDetailsResults.length > 0) {
        coordDetails = coordDetailsResults[0];
      }
    }

    // Build user response object
    const userResponse: any = {
      id: user.id,
      email: user.email,
      FirstName: user.FirstName,
      LastName: user.LastName,
      NickName: user.NickName,
      Address: user.Address,
      PhoneNumber: user.PhoneNumber,
      Gender: user.Gender,
      role: user.userRoles || "user",
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt,
    };

    // Add coordinator details if available
    if (coordDetails) {
      userResponse.coordinatorDetails = {
        id: coordDetails.id,
        fullName: coordDetails.fullName,
        phoneNumber: coordDetails.phoneNumber,
        bio: coordDetails.bio,
        profilePicture: coordDetails.profilePicture,
        specialities: coordDetails.specialities,
        languages: coordDetails.languages,
        certificateLvl: coordDetails.certificateLvl,
        yearsOfExperience: coordDetails.yearsOfExperience,
        type: coordDetails.type,
        accessLvl: coordDetails.accessLvl,
        createdAt: coordDetails.createdAt,
        updatedAt: coordDetails.updatedAt,
      };
    }

    return sendSuccess(
      res,
      "User information retrieved successfully",
      {
        user: userResponse,
      },
      status.OK
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return sendError(
      res,
      "An error occurred while retrieving user information",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
