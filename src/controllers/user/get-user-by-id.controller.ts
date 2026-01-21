import { database } from "@/configs/connection.config";
import { users, coordinatorDetails } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * Get user by ID controller
 * Returns specific user data with coordinator details if applicable
 */
export const getUserByID = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId } = req.params;

    // Validate that userId is provided
    if (!userId || typeof userId !== "string") {
      return sendError(
        res,
        "User ID is required and must be a string",
        status.BAD_REQUEST,
      );
    }

    const db = await database();

    // Fetch user by ID
    const userData = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        nickName: users.nickName,
        email: users.email,
        avatar: users.avatar,
        phoneNumber: users.phoneNumber,
        address: users.address,
        dob: users.dob,
        gender: users.gender,
        provider: users.provider,
        emailVerified: users.emailVerified,
        userRoles: users.userRoles,
        lastActive: users.lastActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        coordinatorDetailsId: users.coordinatorDetails,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Check if user exists
    if (!userData || userData.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    const user = userData[0];

    // Fetch coordinator details if user has coordinator role
    let coordinatorDetailsData = null;
    if (user.coordinatorDetailsId) {
      const coordData = await db
        .select({
          id: coordinatorDetails.id,
          fullName: coordinatorDetails.fullName,
          phoneNumber: coordinatorDetails.phoneNumber,
          bio: coordinatorDetails.bio,
          profilePicture: coordinatorDetails.profilePicture,
          specialities: coordinatorDetails.specialities,
          notificationPref: coordinatorDetails.notificationPref,
          languages: coordinatorDetails.languages,
          certificateLvl: coordinatorDetails.certificateLvl,
          yearsOfExperience: coordinatorDetails.yearsOfExperience,
          type: coordinatorDetails.type,
          accessLvl: coordinatorDetails.accessLvl,
          location: coordinatorDetails.location,
          successRate: coordinatorDetails.successRate,
          repeatCustomers: coordinatorDetails.repeatCustomers,
          totalRevenue: coordinatorDetails.totalRevenue,
          isActive: coordinatorDetails.isActive,
          createdAt: coordinatorDetails.createdAt,
          updatedAt: coordinatorDetails.updatedAt,
        })
        .from(coordinatorDetails)
        .where(eq(coordinatorDetails.id, user.coordinatorDetailsId))
        .limit(1);

      coordinatorDetailsData = coordData.length > 0 ? coordData[0] : null;
    }

    const userWithDetails = {
      ...user,
      coordinatorDetails: coordinatorDetailsData,
    };

    return sendSuccess(
      res,
      "User fetched successfully",
      { user: userWithDetails },
      status.OK,
    );
  } catch (error) {
    console.error("Get user by ID error:", error);
    return sendError(
      res,
      "An error occurred while fetching the user",
      status.INTERNAL_SERVER_ERROR,
    );
  }
};
