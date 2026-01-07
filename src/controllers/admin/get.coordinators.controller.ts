import { database } from "@/configs/connection.config";
import { 
  coordinatorDetails, 
  users, 
  trips, 
  tripCoordinators, 
  payments, 
  reviews
} from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq, sql, and, inArray } from "drizzle-orm";

export const getCoordinators = async (_req: Request, res: Response) => {
  try {
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

    const coordinatorsData = await db
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
        lastActive: users.lastActive,
        emailVerified: users.emailVerified,
        userCreatedAt: users.createdAt,
        isActive: coordinatorDetails.isActive
      })
      .from(coordinatorDetails)
      .innerJoin(users, eq(coordinatorDetails.userId, users.id));
    
    const coordinators = coordinatorsData.map(coordinator => {
        const stat = tripStats.find(s => s.userId === coordinator.userId) ?? {
          totalTrips: 0,
          completedTrips: 0,
          totalRevenue: 0,
          repeatCustomers: 0,
        };

        const successRate =
          stat.totalTrips > 0
            ? (stat.completedTrips / stat.totalTrips) * 100
            : 0;

        const customerSatisfaction = ratingMap.get(coordinator.userId) ?? 0;

        const overallPerformance =
          (successRate * 0.4) +
          ((customerSatisfaction / 5) * 100 * 0.3) +
          (stat.repeatCustomers * 0.3);

        return {
          ...coordinator,
          successRate: Number(successRate.toFixed(2)),
          totalRevenue: Number(stat.totalRevenue.toFixed(2)),
          customerSatisfaction: Number(customerSatisfaction.toFixed(1)),
          repeatCustomers: stat.repeatCustomers,
          overallPerformance: Number(overallPerformance.toFixed(2)),
        };
    });

    return sendSuccess(
      res,
      "Coordinators fetched successfully",
      { coordinators },
      status.OK
    );
  } catch (error) {
    console.error("Get coordinators error:", error);
    return sendError(
      res,
      "An error occurred while fetching coordinators",
      status.INTERNAL_SERVER_ERROR
    );
  }
};