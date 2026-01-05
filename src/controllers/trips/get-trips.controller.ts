import { database } from "@/configs/connection.config";
import { trips } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/trip:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get all trips
 *     description: Get all trips
 */
export const getTrips = async (_: Request, res: Response): Promise<Response> => {
    try {
      const db = await database();
      const tripsData = await db.select().from(trips);
      const mappedTripsData = tripsData.map((trip: any) => {
        return {
          id: trip.id,
          name: trip.title,
          coordinators: trip.coordinators,
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
      });
      return sendSuccess(res, "Trips fetched successfully", { trips: mappedTripsData }, status.OK);
    } catch (error) {
      console.error("Get trips error:", error);
      return sendError(res, "An error occurred while fetching trips", status.INTERNAL_SERVER_ERROR);
    }
  };