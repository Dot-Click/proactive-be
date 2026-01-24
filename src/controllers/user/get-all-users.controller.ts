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
      .from(users).where(eq(users.userRoles, "user"));

    return sendSuccess(
      res,
      "Users fetched successfully",
      { users: allUsers, total: allUsers.length },
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
