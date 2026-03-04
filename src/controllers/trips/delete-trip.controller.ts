import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { database } from "@/configs/connection.config";
import { trips } from "@/schema/schema";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/trips/{id}:
 *   delete:
 *     tags:
 *       - Trips
 *     summary: Delete a trip by ID
 *     description: Delete a trip by ID (Admin/Coordinator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       404:
 *         description: Trip not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const deleteTrip = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { id } = req.params;

    if (!id) {
      return sendError(res, "Trip ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    // Check if trip exists
    const tripExists = await db
      .select({ id: trips.id })
      .from(trips)
      .where(eq(trips.id, id))
      .limit(1);

    if (tripExists.length === 0) {
      return sendError(res, "Trip not found", status.NOT_FOUND);
    }

    // Delete the trip
    await db.delete(trips).where(eq(trips.id, id));

    return sendSuccess(res, "Trip deleted successfully", status.OK);
  } catch (error: any) {
    console.error("Error deleting trip:", error);
    return sendError(
      res,
      "Failed to delete trip",
      status.INTERNAL_SERVER_ERROR,
      error
    );
  }
};
