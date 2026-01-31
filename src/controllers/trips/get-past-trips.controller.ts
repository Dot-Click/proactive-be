import { database } from "@/configs/connection.config";
import { trips, tripCoordinators, coordinatorDetails, users, locations } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { and, desc, eq, lt } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * Public endpoint: Get past trips (endDate < today). No auth required.
 */
export const getPastTrips = async (req: Request, res: Response): Promise<Response> => {
  try {
    const db = await database();
    const { type } = req.query;
    const now = new Date();

    const conditions = [
      eq(trips.approvalStatus, "approved"),
      lt(trips.endDate, now),
    ];
    if (type && typeof type === "string") {
      conditions.push(eq(trips.type, type));
    }

    const tripsData = await db
      .select({
        trip: trips,
        locationName: locations.name,
      })
      .from(trips)
      .leftJoin(locations, eq(trips.locationId, locations.id))
      .where(and(...conditions))
      .orderBy(desc(trips.endDate));

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
          .leftJoin(coordinatorDetails, eq(coordinatorDetails.userId, tripCoordinators.userId))
          .leftJoin(users, eq(users.id, tripCoordinators.userId))
          .where(eq(tripCoordinators.tripId, trip.id));

        return {
          id: trip.id,
          title: trip.title,
          name: trip.title,
          coordinators: coordinatorsResult,
          description: trip.description,
          category: trip.type,
          type: trip.type,
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

    return sendSuccess(res, "Past trips fetched successfully", {
      trips: tripsWithCoordinators,
    }, status.OK);
  } catch (error) {
    console.error("Get past trips error:", error);
    return sendError(res, "An error occurred while fetching past trips", status.INTERNAL_SERVER_ERROR);
  }
};
