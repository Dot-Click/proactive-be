import { database } from "@/configs/connection.config";
import { discounts } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/discounts/trip/{tripId}:
 *   get:
 *     tags:
 *       - Discounts
 *     summary: Get all discounts for a trip
 *     description: Retrieve all discount codes for a specific trip.
 */
export const getDiscountsByTrip = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return sendError(res, "Trip ID is required", status.BAD_REQUEST);
    }

    const db = await database();
    const result = await db
      .select()
      .from(discounts)
      .where(eq(discounts.tripId, tripId));

    return sendSuccess(res, "Discounts for trip retrieved successfully", result);
  } catch (error) {
    console.error("Get discounts by trip error:", error);
    return sendError(
      res,
      "An error occurred while fetching the discounts",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
