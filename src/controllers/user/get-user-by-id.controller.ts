import { database } from "@/configs/connection.config";
import { users, coordinatorDetails, payments, trips, achievements } from "@/schema/schema";
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
        badges: achievements.badges,
        points: achievements.points,
        achievementId: achievements.id,
        dob: users.dob,
        trips: { title: trips.title, status: trips.status },
        payments: payments.amount,
        paymentId: payments.id,
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
      .leftJoin(payments, eq(users.id, payments.userId))
      .leftJoin(trips, eq(payments.tripId, trips.id))
      .leftJoin(achievements, eq(users.id, achievements.userId))
      .where(eq(users.id, userId))

      // Check if user exists
      if (!userData || userData.length === 0) {
        return sendError(res, "User not found", status.NOT_FOUND);
      }

      // De-duplicate results to handle Cartesian product from multiple joins
      const uniquePayments = new Map<string, number>();
      const uniqueAchievements = new Map<string, { badges: any; points: number }>();
      const uniqueTrips = new Map<string, any>();

      userData.forEach((row: any) => {
        if (row.paymentId && row.payments) {
          uniquePayments.set(row.paymentId, Number(row.payments));
        }
        if (row.achievementId) {
          uniqueAchievements.set(row.achievementId, {
            badges: row.badges,
            points: Number(row.points) || 0,
          });
        }
        if (row.trips && row.trips.title) {
          uniqueTrips.set(row.trips.title, row.trips);
        }
      });

      const totalAmount = Array.from(uniquePayments.values()).reduce((sum, val) => sum + val, 0);
      const totalPoints = Array.from(uniqueAchievements.values()).reduce((sum, val) => sum + val.points, 0);
      const badgeList = Array.from(new Set(Array.from(uniqueAchievements.values()).map(a => a.badges))).filter(Boolean);
      const tripList = Array.from(uniqueTrips.values());

    const user = userData[0];

    const userWithDetails = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      email: user.email,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      address: user.address,
      badges: badgeList,
      points: totalPoints,
      dob: user.dob,
      gender: user.gender,
      provider: user.provider,
      emailVerified: user.emailVerified,
      userRoles: user.userRoles,
      lastActive: user.lastActive,
      memberSince: user.createdAt,
      updatedAt: user.updatedAt,
      destinations: tripList.length,
      completedTrips: tripList.filter((trip: any) => trip.status === 'completed').length,
      totalAmount,
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
