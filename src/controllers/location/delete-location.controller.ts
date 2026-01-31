import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { locations, trips } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/admin/location/{locationId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete a location
 *     description: Delete a location. Fails if any trip references this location (Admin only).
 *     security:
 *       - bearerAuth: []
 */
export const deleteLocation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { locationId } = req.params;

    if (!locationId) {
      return sendError(res, "Location ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    const existing = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (existing.length === 0) {
      return sendError(res, "Location not found", status.NOT_FOUND);
    }

    const tripsUsingLocation = await db
      .select({ id: trips.id })
      .from(trips)
      .where(eq(trips.locationId, locationId))
      .limit(1);

    if (tripsUsingLocation.length > 0) {
      return sendError(
        res,
        "Cannot delete location: one or more trips use this location. Reassign or delete those trips first.",
        status.BAD_REQUEST
      );
    }

    await db.delete(locations).where(eq(locations.id, locationId));

    return sendSuccess(
      res,
      "Location deleted successfully",
      {},
      status.OK
    );
  } catch (error) {
    console.error("Delete location error:", error);
    return sendError(
      res,
      "An error occurred while deleting location",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
