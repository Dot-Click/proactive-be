import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { locations } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { updateLocationSchema } from "@/types/location.types";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/admin/location/{locationId}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update a location
 *     description: Update an existing location (Admin only)
 *     security:
 *       - bearerAuth: []
 */
export const updateLocation = async (
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

    const validationResult = updateLocationSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        errors
      );
    }

    const updateData = validationResult.data;
    const db = await database();

    const existing = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (existing.length === 0) {
      return sendError(res, "Location not found", status.NOT_FOUND);
    }

    if (updateData.name !== undefined && updateData.name !== existing[0].name) {
      const duplicate = await db
        .select()
        .from(locations)
        .where(eq(locations.name, updateData.name))
        .limit(1);
      if (duplicate.length > 0) {
        return sendError(
          res,
          "A location with this name already exists",
          status.CONFLICT
        );
      }
    }

    const updated = await db
      .update(locations)
      .set(updateData)
      .where(eq(locations.id, locationId))
      .returning({
        id: locations.id,
        name: locations.name,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      });

    return sendSuccess(
      res,
      "Location updated successfully",
      { location: updated[0] },
      status.OK
    );
  } catch (error) {
    console.error("Update location error:", error);
    return sendError(
      res,
      "An error occurred while updating location",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
