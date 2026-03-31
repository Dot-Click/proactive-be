import { database } from "@/configs/connection.config";
import {
  trips,
  tripCoordinators,
  coordinatorDetails,
  users,
  locations,
  categories,
  applications,
  payments,
} from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq, and } from "drizzle-orm";
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
export const getTripById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const db = await database();

    // Get trip details with location name and category name
    const tripResult = await db
      .select({
        // Core fields
        trip: trips,
        locationName: locations.name,
        categoryName: categories.name,
      })
      .from(trips)
      .leftJoin(locations, eq(trips.locationId, locations.id))
      .leftJoin(categories, eq(trips.categoryId, categories.id))
      .where(eq(trips.id, id));

    if (tripResult.length === 0) {
      return sendError(res, "Trip not found", status.NOT_FOUND);
    }

    const row = tripResult[0];
    const trip = row.trip;

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
      .leftJoin(
        coordinatorDetails,
        eq(coordinatorDetails.userId, tripCoordinators.userId)
      )
      .leftJoin(users, eq(users.id, tripCoordinators.userId))
      .where(eq(tripCoordinators.tripId, id));

    // Attach coordinators, location, category, and all dynamic fields to trip
    const tripWithCoordinators = {
      ...trip,
      location: row.locationName ?? null,
      locationId: trip.locationId,
      categoryId: trip.categoryId,
      category: row.categoryName ?? null, // Category name for backward compatibility
      categoryName: row.categoryName ?? null, // Explicit category name field
      type: row.categoryName ?? null, // Legacy field for backward compatibility
      coordinators: coordinatorsResult,
      coordinator: coordinatorsResult[0] || null, // For backward compatibility
      coordinatorId: coordinatorsResult[0]?.id || null, // For backward compatibility
      
      // Get confirmed participants manually as a fast query
      participants: await db
        .select({
          userId: users.id,
          userFirstName: users.firstName,
          userLastName: users.lastName,
          avatar: users.avatar,
          paymentStatus: payments.status,
        })
        .from(applications)
        .innerJoin(users, eq(users.id, applications.userId))
        .leftJoin(
          payments,
          and(
            eq(payments.userId, applications.userId),
            eq(payments.tripId, id)
          )
        )
        .where(
          and(
            eq(applications.tripId, id),
            eq(applications.status, "approved")
          )
        ),
      // Ensure dynamic fields are included
      highlights: trip.highlights || [],
      mood: trip.mood || [],
      commonFund: trip.commonFund || null,
      commonFundDescription: trip.commonFundDescription || null,
      commonFundCount: trip.commonFundCount || null,
      thingsToKnow: trip.thingsToKnow || [],
      rating: trip.rating || "4.9",
      reviewsCount: trip.reviewsCount || 92,
      reviewLink: trip.reviewLink || "https://www.google.com/maps/place/Proactive+Future/@35.67445,-6.8143,2933475m/data=!3m2!1e3!4b1!4m6!3m5!1s0x65e285d9dffa46ab:0x3dd1b18e867e6183!8m2!3d35.67445!4d-6.8143!16s%2Fg%2F11t6yzt6vh?entry=ttu&g_ep=EgoyMDI2MDMyOS4wIKXMDSoASAFQAw%3D%3D",
    };

    console.log("📤 GET Trip by ID - Returning Dynamic Fields:", {
      highlights: tripWithCoordinators.highlights,
      mood: tripWithCoordinators.mood,
      commonFund: tripWithCoordinators.commonFund,
      commonFundDescription: tripWithCoordinators.commonFundDescription,
      commonFundCount: tripWithCoordinators.commonFundCount,
      thingsToKnow: tripWithCoordinators.thingsToKnow,
    });

    return sendSuccess(
      res,
      "Trip fetched successfully",
      { trip: tripWithCoordinators },
      status.OK
    );
  } catch (error) {
    console.error("Get trip by ID error:", error);
    return sendError(
      res,
      "An error occurred while fetching trip",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
