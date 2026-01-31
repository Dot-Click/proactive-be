import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { locations } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { desc } from "drizzle-orm";

/**
 * @swagger
 * /api/admin/location:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all locations
 *     description: Retrieve all locations (Admin only for mutate; list can be used by coordinators for trip form)
 *     security:
 *       - bearerAuth: []
 */
export const getLocations = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const db = await database();

    const allLocations = await db
      .select({
        id: locations.id,
        name: locations.name,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      })
      .from(locations)
      .orderBy(desc(locations.createdAt));

    return sendSuccess(
      res,
      "Locations retrieved successfully",
      { locations: allLocations },
      status.OK
    );
  } catch (error) {
    console.error("Get locations error:", error);
    return sendError(
      res,
      "An error occurred while retrieving locations",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
