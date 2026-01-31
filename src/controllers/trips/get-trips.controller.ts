import { database } from "@/configs/connection.config";
import { trips, tripCoordinators, coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { and, eq, lt, gte } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/trips:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get all trips
 *     description: Get all trips with coordinators. Query params: status, type, past, upcoming
 */
export const getTrips = async (req: Request, res: Response): Promise<Response> => {
    try {
      const db = await database();
      const { status: statusFilter, type, past, upcoming } = req.query;

      const conditions = [];
      // Only show approved trips for listing
      // conditions.push(eq(trips.approvalStatus, "approved"));

      if (statusFilter && typeof statusFilter === "string") {
        conditions.push(eq(trips.status, statusFilter as any));
      }
      if (type && typeof type === "string") {
        conditions.push(eq(trips.type, type));
      }
      const now = new Date();
      if (past === "true") {
        conditions.push(lt(trips.endDate, now));
      }
      if (upcoming === "true") {
        conditions.push(gte(trips.startDate, now));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const tripsData = await db.select().from(trips).where(whereClause);

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
            location: trip.location,
            duration: trip.duration,
            groupSize: trip.groupSize,
            perHeadPrice: trip.perHeadPrice,
            shortDesc: trip.shortDesc,
          };
        })
      );

      const counts = {
        all: tripsWithCoordinators.length,
        open: tripsWithCoordinators.filter((t: any) => t.status === "open").length,
        comingSoon: tripsWithCoordinators.filter((t: any) => t.status === "live").length,
        closed: tripsWithCoordinators.filter((t: any) => t.status === "completed").length,
      };

      return sendSuccess(res, "Trips fetched successfully", {
        trips: tripsWithCoordinators,
        counts,
      }, status.OK);
    } catch (error) {
      console.error("Get trips error:", error);
      return sendError(res, "An error occurred while fetching trips", status.INTERNAL_SERVER_ERROR);
    }
  };