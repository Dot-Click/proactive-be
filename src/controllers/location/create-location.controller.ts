import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { locations } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { createLocationSchema } from "@/types/location.types";
import "@/middlewares/auth.middleware";
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/admin/location:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a new location
 *     description: Create a new location (Admin only)
 *     security:
 *       - bearerAuth: []
 */
export const createLocation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const validationResult = createLocationSchema.safeParse(req.body);
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

    const { name } = validationResult.data;
    const db = await database();

    const existing = await db
      .select()
      .from(locations)
      .where(eq(locations.name, name))
      .limit(1);

    if (existing.length > 0) {
      return sendError(
        res,
        "A location with this name already exists",
        status.CONFLICT
      );
    }

    const newLocation = await db
      .insert(locations)
      .values({
        id: createId(),
        name,
      })
      .returning({
        id: locations.id,
        name: locations.name,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      });

    const location = newLocation[0];

    return sendSuccess(
      res,
      "Location created successfully",
      { location },
      status.CREATED
    );
  } catch (error) {
    console.error("Create location error:", error);
    return sendError(
      res,
      "An error occurred while creating location",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
