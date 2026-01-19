import { database } from "@/configs/connection.config";
import { trips, tripCoordinators, coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/trip:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get all trips
 *     description: Get all trips with coordinators
 */
export const getTrips = async (_: Request, res: Response): Promise<Response> => {
    try {
      const db = await database();
      const tripsData = await db.select().from(trips);
      
      // Fetch coordinators for all trips
      const tripsWithCoordinators = await Promise.all(
        tripsData.map(async (trip: any) => {
          const coordinatorsResult = await db
            .select({
              id: tripCoordinators.userId,
              _id: tripCoordinators.userId,
              fullName: coordinatorDetails.fullName,
              email: users.email,
              profilePicture: coordinatorDetails.profilePicture,
              bio: coordinatorDetails.bio,
            })
            .from(tripCoordinators)
            .leftJoin(coordinatorDetails, eq(coordinatorDetails.userId, tripCoordinators.userId))
            .leftJoin(users, eq(users.id, tripCoordinators.userId))
            .where(eq(tripCoordinators.tripId, trip.id));
          
          return {
            id: trip.id,
            name: trip.title,
            coordinators: coordinatorsResult,
            description: trip.description,
            category: trip.type,
            startDate: trip.startDate,
            endDate: trip.endDate,
            status: trip.status,
            approvalStatus: trip.approvalStatus,
            coverImage: trip.coverImage,
            location: trip.location,
            duration: trip.duration
          };
        })
      );
      
      return sendSuccess(res, "Trips fetched successfully", { trips: tripsWithCoordinators }, status.OK);
    } catch (error) {
      console.error("Get trips error:", error);
      return sendError(res, "An error occurred while fetching trips", status.INTERNAL_SERVER_ERROR);
    }
  };