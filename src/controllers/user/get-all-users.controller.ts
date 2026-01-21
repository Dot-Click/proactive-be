import { database } from "@/configs/connection.config";
import { users, coordinatorDetails } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * Get all users controller
 * Returns all users with their basic information and coordinator details
 */
export const getAllUsers = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const db = await database();

    const allUsers = await db
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
        userStatus: users.userStatus,
        lastActive: users.lastActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        coordinatorDetailsId: users.coordinatorDetails,
      })
      .from(users);

    // Fetch coordinator details for users with coordinator role
    const coordinatorIds = allUsers
      .filter((user) => user.coordinatorDetailsId)
      .map((user) => user.coordinatorDetailsId)
      .filter((id): id is string => id !== null);

    let coordinatorDetailsMap = new Map();

    if (coordinatorIds.length > 0) {
      const coordinatorsData = await db
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
        .from(coordinatorDetails);

      coordinatorDetailsMap = new Map(
        coordinatorsData.map((coord) => [coord.id, coord]),
      );
    }

    const usersWithDetails = allUsers.map((user) => ({
      ...user,
      coordinatorDetails: user.coordinatorDetailsId
        ? coordinatorDetailsMap.get(user.coordinatorDetailsId) || null
        : null,
    }));

    return sendSuccess(
      res,
      "Users fetched successfully",
      { users: usersWithDetails, total: usersWithDetails.length },
      status.OK,
    );
  } catch (error) {
    console.error("Get all users error:", error);
    return sendError(
      res,
      "An error occurred while fetching users",
      status.INTERNAL_SERVER_ERROR,
    );
  }
};
