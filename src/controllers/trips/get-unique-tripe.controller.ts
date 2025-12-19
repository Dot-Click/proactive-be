import { database } from "@/configs/connection.config";
import { trips } from "@/schema/schema";
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
 *     description: Get a trip by ID
 */
export const getTripById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const db = await database();
      const trip = await db.select().from(trips).where(eq(trips.id, id));
      return sendSuccess(res, "Trip fetched successfully", { trip }, status.OK);
    } catch (error) {
      console.error("Get trip by ID error:", error);
      return sendError(res, "An error occurred while fetching trip", status.INTERNAL_SERVER_ERROR);
    }
  };