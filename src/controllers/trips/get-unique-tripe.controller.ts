import { database } from "@/configs/connection.config";
import { trips, tripCoordinators, coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/trip/{id}:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get a trip by ID
 *     description: Get a trip by ID with coordinators
 */
export const getTripById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const db = await database();
      
      // Get trip details
      const tripResult = await db.select().from(trips).where(eq(trips.id, id));
      
      if (tripResult.length === 0) {
        return sendError(res, "Trip not found", status.NOT_FOUND);
      }
      
      const trip = tripResult[0];
      
      // Get coordinators for this trip
      const coordinatorsResult = await db
        .select({
          id: tripCoordinators.userId,
          _id: tripCoordinators.userId,
          fullName: coordinatorDetails.fullName,
          email: users.email,
          profilePicture: coordinatorDetails.profilePicture,
          bio: coordinatorDetails.bio,
          CoordinatorName: coordinatorDetails.fullName,
          CoordinatorEmail: users.email,
          CoordinatorPhoto: coordinatorDetails.profilePicture,
          CoordinatorBio: coordinatorDetails.bio,
        })
        .from(tripCoordinators)
        .leftJoin(coordinatorDetails, eq(coordinatorDetails.userId, tripCoordinators.userId))
        .leftJoin(users, eq(users.id, tripCoordinators.userId))
        .where(eq(tripCoordinators.tripId, id));
      
      // Attach coordinators to trip
      const tripWithCoordinators = {
        ...trip,
        coordinators: coordinatorsResult,
        coordinator: coordinatorsResult[0] || null, // For backward compatibility
        coordinatorId: coordinatorsResult[0]?.id || null, // For backward compatibility
      };
      
      return sendSuccess(res, "Trip fetched successfully", { trip: tripWithCoordinators }, status.OK);
    } catch (error) {
      console.error("Get trip by ID error:", error);
      return sendError(res, "An error occurred while fetching trip", status.INTERNAL_SERVER_ERROR);
    }
  };