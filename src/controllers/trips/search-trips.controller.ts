import { database } from "@/configs/connection.config";
import {
  trips,
  tripCoordinators,
  coordinatorDetails,
  users,
  locations,
} from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq, or, ilike } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/trip/search:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Search trips by name or location
 *     description: Search for trips using trip name or location. Returns matching trips with coordinator details.
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for trip name or location
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */
export const searchTrips = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { query } = req.query;

    // Validate search query
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return sendError(res, "Search query is required", status.BAD_REQUEST);
    }

    const searchTerm = `%${query.trim()}%`;
    const db = await database();

    // Search trips by title, description, or location name (via join)
    const tripsData = await db
      .select({
        trip: trips,
        locationName: locations.name,
      })
      .from(trips)
      .leftJoin(locations, eq(trips.locationId, locations.id))
      .where(
        or(
          ilike(trips.title, searchTerm),
          ilike(trips.description, searchTerm),
          ilike(locations.name, searchTerm)
        )
      );

    // If no trips found, return empty array
    if (tripsData.length === 0) {
      return sendSuccess(
        res,
        "No trips found matching your search",
        { trips: [] },
        status.OK
      );
    }

    // Fetch coordinators for all matching trips
    const tripsWithCoordinators = await Promise.all(
      tripsData.map(async (row: any) => {
        const trip = row.trip;
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
          .leftJoin(
            coordinatorDetails,
            eq(coordinatorDetails.userId, tripCoordinators.userId)
          )
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
          location: row.locationName ?? null,
          locationId: trip.locationId,
          duration: trip.duration,
          groupSize: trip.groupSize,
          perHeadPrice: trip.perHeadPrice,
          shortDesc: trip.shortDesc,
        };
      })
    );

    return sendSuccess(
      res,
      `Found ${tripsWithCoordinators.length} trip(s) matching "${query}"`,
      { trips: tripsWithCoordinators, count: tripsWithCoordinators.length },
      status.OK
    );
  } catch (error) {
    console.error("Search trips error:", error);
    return sendError(
      res,
      "An error occurred while searching trips",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
