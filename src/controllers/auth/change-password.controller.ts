import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users } from "@/schema/schema";
import { hashPassword, verifyPassword } from "@/utils/password.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { changePasswordSchema } from "@/types/auth.types";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change password
 *     description: Change password for authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: CurrentPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(
        res,
        "Authentication required",
        status.UNAUTHORIZED
      );
    }

    // Validate request body
    const validationResult = changePasswordSchema.safeParse(req.body);
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

    const { currentPassword, newPassword } = validationResult.data;
    const db = await database();

    // Get user from database
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (userResults.length === 0) {
      return sendError(
        res,
        "User not found",
        status.NOT_FOUND
      );
    }

    const user = userResults[0];

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return sendError(
        res,
        "Current password is incorrect",
        status.BAD_REQUEST
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return sendError(
        res,
        "New password must be different from current password",
        status.BAD_REQUEST
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    return sendSuccess(
      res,
      "Password changed successfully",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Change password error:", error);
    return sendError(
      res,
      "An error occurred while changing password",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

