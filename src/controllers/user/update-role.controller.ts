import { database } from "@/configs/connection.config";
import { users, coordinatorDetails } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";

const updateRoleSchema = z.object({
  role: z.enum(["user", "coordinator", "admin"]),
});

/**
 * Update user role controller
 * Updates the role of a specific user (only admin can do this)
 * - Upgrade member to coordinator or admin
 * - Upgrade coordinator to admin
 * - Downgrade admin to coordinator or user
 * - Downgrade coordinator to user
 */
export const updateUserRole = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { role: newRole } = req.body;

    if (!userId) {
      return sendError(res, "User ID is required", status.BAD_REQUEST);
    }

    // Validate request body
    const validationResult = updateRoleSchema.safeParse({ role: newRole });
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

    const currentRole = existingUser.userRoles || "user";

    // If changing to coordinator or upgrading to coordinator/admin, create/ensure coordinator details exist
    if ((newRole === "coordinator" || newRole === "admin") && currentRole === "user") {
      // Check if coordinator details already exist
      const [existingCoordinatorDetails] = await db
        .select()
        .from(coordinatorDetails)
        .where(eq(coordinatorDetails.userId, userId));

      // If no coordinator details exist, create them
      if (!existingCoordinatorDetails) {
        const coordinatorId = createId();
        await db.insert(coordinatorDetails).values({
          id: coordinatorId,
          userId,
          fullName:
            `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim() ||
            existingUser.nickName ||
            "Coordinator",
          phoneNumber: existingUser.phoneNumber,
          isActive: true,
        });

        // Update user to reference the new coordinator details
        await db
          .update(users)
          .set({
            coordinatorDetails: coordinatorId,
          })
          .where(eq(users.id, userId));
      }
    }

    // Update user role
    const [updatedUser] = await db
      .update(users)
      .set({
        userRoles: newRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return sendSuccess(
      res,
      `User role updated successfully to ${newRole}`,
      { user: updatedUser },
      status.OK,
    );
  } catch (error: any) {
    console.error("Update user role error:", error);
    return sendError(
      res,
      error.message || "An error occurred while updating user role",
      status.INTERNAL_SERVER_ERROR,
    );
  }
};
