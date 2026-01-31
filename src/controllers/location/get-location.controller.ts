import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { locations } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/admin/location/{locationId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get a location by ID
 *     description: Retrieve a single location by ID (Admin only)
 *     security:
 *       - bearerAuth: []
 */
export const getLocation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { locationId } = req.params;

    if (!locationId) {
      return sendError(res, "Location ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    const results = await db
      .select({
        id: locations.id,
        name: locations.name,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      })
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (results.length === 0) {
      return sendError(res, "Location not found", status.NOT_FOUND);
    }

    return sendSuccess(
      res,
      "Location retrieved successfully",
      { location: results[0] },
      status.OK
    );
  } catch (error) {
    console.error("Get location error:", error);
    return sendError(
      res,
      "An error occurred while retrieving location",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
