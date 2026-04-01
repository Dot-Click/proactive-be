import { database } from "@/configs/connection.config";
import {
  trips,
  tripCoordinators,
  coordinatorDetails,
  users,
  locations,
  categories,
} from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { and, eq, gte, inArray } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * Public endpoint: Get open/upcoming trips (no auth required).
 * Returns approved trips with status "open" or "live", startDate >= today.
 */
export const getOpenTrips = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const db = await database();
    const { type } = req.query;
    const now = new Date();

    const conditions = [
      inArray(trips.status, ["open", "live", "active", "coming soon"]),
      gte(trips.startDate, now),
    ];
    if (type && typeof type === "string") {
      conditions.push(eq(categories.name, type));
    }

    const tripsData = await db
      .select({
        trip: trips,
        locationName: locations.name,
        categoryName: categories.name,
      })
      .from(trips)
      .leftJoin(locations, eq(trips.locationId, locations.id))
      .leftJoin(categories, eq(trips.categoryId, categories.id))
      .where(and(...conditions));

    if (tripsData.length === 0) {
      return sendSuccess(
        res,
        "No open trips found",
        {
          trips: [],
          counts: { all: 0, open: 0, comingSoon: 0, closed: 0 },
        },
        status.OK
      );
    }

    // Bulk fetch coordinators for all trips
    const allCoordinators = await db
      .select({
        tripId: tripCoordinators.tripId,
        userId: tripCoordinators.userId,
        _id: tripCoordinators.userId,
        fullName: coordinatorDetails.fullName,
        email: users.email,
        profilePicture: coordinatorDetails.profilePicture,
        bio: coordinatorDetails.bio,
      })
      .from(tripCoordinators)
      .leftJoin(coordinatorDetails, eq(coordinatorDetails.userId, tripCoordinators.userId))
      .leftJoin(users, eq(users.id, tripCoordinators.userId))
      .where(inArray(tripCoordinators.tripId, tripsData.map(t => t.trip.id)));

    const coordinatorsByTrip = new Map();
    allCoordinators.forEach(c => {
      if (!coordinatorsByTrip.has(c.tripId)) {
        coordinatorsByTrip.set(c.tripId, []);
      }
      coordinatorsByTrip.get(c.tripId).push(c);
    });

    const tripsWithCoordinators = tripsData.map((row: any) => {
      const trip = row.trip;
      return {
        id: trip.id,
        title: trip.title,
        name: trip.title,
        coordinators: coordinatorsByTrip.get(trip.id) || [],
        description: trip.description,
        category: row.categoryName ?? null,
        type: row.categoryName ?? null,
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
    });

    const counts = {
      all: tripsWithCoordinators.length,
      open: tripsWithCoordinators.filter((t: any) => 
        t.status === "open" || t.status === "active"
      ).length,
      comingSoon: tripsWithCoordinators.filter((t: any) => 
        t.status === "live" || t.status === "coming soon"
      ).length,
      closed: 0,
    };

    return sendSuccess(
      res,
      "Open trips fetched successfully",
      {
        trips: tripsWithCoordinators,
        counts,
      },
      status.OK
    );
  } catch (error) {
    console.error("Get open trips error:", error);
    return sendError(
      res,
      "An error occurred while fetching open trips",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
