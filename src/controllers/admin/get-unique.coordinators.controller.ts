import { database } from "@/configs/connection.config";
import { coordinatorDetails, users, tripCoordinators, trips, payments, reviews } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq, sql } from "drizzle-orm";

export const getCoordinatorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, "Coordinator ID is required", status.BAD_REQUEST);
    }

    const db = await database();
    
    const tripStats = await db
          .select({
            userId: tripCoordinators.userId,
    
            totalTrips: sql<number>`COUNT(DISTINCT ${trips.id})::int`,
    
            completedTrips: sql<number>`
              COUNT(DISTINCT ${trips.id})
              FILTER (WHERE ${trips.status} = 'completed')::int
            `,
    
            totalRevenue: sql<number>`
              COALESCE(SUM(${payments.amount}) FILTER (WHERE ${payments.status} = 'paid'), 0)::float
            `,
    
            repeatCustomers: sql<number>`
              COUNT(DISTINCT ${payments.userId})
              FILTER (
                WHERE ${payments.userId} IN (
                  SELECT ${payments.userId}
                  FROM ${payments}
                  GROUP BY ${payments.userId}
                  HAVING COUNT(DISTINCT ${payments.tripId}) > 1
                )
              )::int
            `,
          })
          .from(tripCoordinators)
          .innerJoin(trips, eq(tripCoordinators.tripId, trips.id))
          .leftJoin(payments, eq(payments.tripId, trips.id))
          .groupBy(tripCoordinators.userId);
    
        const ratingStats = await db
          .select({
            userId: tripCoordinators.userId,
            avgRating: sql<number>`COALESCE(AVG(${reviews.rating}::numeric), 0)::float`,
          })
          .from(tripCoordinators)
          .innerJoin(reviews, eq(reviews.tripId, tripCoordinators.tripId))
          .groupBy(tripCoordinators.userId);
    
        const ratingMap = new Map(ratingStats.map(r => [r.userId, r.avgRating]));


    const coordinatorResults = await db
      .select({
        id: coordinatorDetails.id,
        userId: coordinatorDetails.userId,
        fullName: coordinatorDetails.fullName,
        phoneNumber: coordinatorDetails.phoneNumber,
        bio: coordinatorDetails.bio,
        profilePicture: coordinatorDetails.profilePicture,
        specialities: coordinatorDetails.specialities,
        languages: coordinatorDetails.languages,
        certificateLvl: coordinatorDetails.certificateLvl,
        yearsOfExperience: coordinatorDetails.yearsOfExperience,
        location: coordinatorDetails.location,
        type: coordinatorDetails.type,
        accessLvl: coordinatorDetails.accessLvl,
        createdAt: coordinatorDetails.createdAt,
        updatedAt: coordinatorDetails.updatedAt,
        email: users.email,
        emailVerified: users.emailVerified,
        userCreatedAt: users.createdAt,
      })
      .from(coordinatorDetails)
      .innerJoin(users, eq(coordinatorDetails.userId, users.id))
      .where(eq(coordinatorDetails.id, id))
      .limit(1);

    if (coordinatorResults.length === 0) {
      return sendError(res, "Coordinator not found", status.NOT_FOUND);
    }

    
        const stat = tripStats.find(s => s.userId === coordinatorResults[0].userId) ?? {
          totalTrips: 0,
          completedTrips: 0,
          totalRevenue: 0,
          repeatCustomers: 0,
        };

        const successRate =
          stat.totalTrips > 0
            ? (stat.completedTrips / stat.totalTrips) * 100
            : 0;

        const customerSatisfaction = ratingMap.get(coordinatorResults[0].userId) ?? 0;

        const overallPerformance =
          (successRate * 0.4) +
          ((customerSatisfaction / 5) * 100 * 0.3) +
          (stat.repeatCustomers * 0.3);

    return sendSuccess(
      res,
      "Coordinator fetched successfully",
      { coordinator: {...coordinatorResults[0], ...stat, successRate, customerSatisfaction, overallPerformance} },
      status.OK
    );
  } catch (error) {
    console.error("Get coordinator by id error:", error);
    return sendError(res, "An error occurred while fetching coordinator", status.INTERNAL_SERVER_ERROR);
  }
};