import { database } from "@/configs/connection.config";
import { users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

/**
 * Update user status controller
 * Updates the status of a specific user
 */
export const updateUserStatus = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { status: newStatus } = req.body;

    if (!userId) {
      return sendError(res, "User ID is required", status.BAD_REQUEST);
    }

    // Validate request body
    const validationResult = updateStatusSchema.safeParse({ status: newStatus });
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
        errors,
      );
    }

    const db = await database();

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!existingUser) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    // Update user status
    const [updatedUser] = await db
      .update(users)
      .set({
        userStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return sendSuccess(
      res,
      "User status updated successfully",
      { user: updatedUser },
      status.OK,
    );
  } catch (error: any) {
    console.error("Update user status error:", error);
    return sendError(
      res,
      error.message || "An error occurred while updating user status",
      status.INTERNAL_SERVER_ERROR,
    );
  }
};
