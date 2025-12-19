import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, verification } from "@/schema/schema";
import { hashPassword } from "@/utils/password.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { resetPasswordSchema } from "@/types/auth.types";
import status from "http-status";
import { eq, and, gt, like } from "drizzle-orm";

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Reset user password using reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset_token_here
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully
 *       400:
 *         description: Validation error or invalid token
 *       404:
 *         description: Reset token not found or expired
 *       500:
 *         description: Internal server error
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
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

    const { token, password } = validationResult.data;
    const db = await database();

    // Trim token to handle any whitespace issues
    const trimmedToken = token.trim();

    // Validate token format (should be 5-6 digits)
    if (!/^\d{5,6}$/.test(trimmedToken)) {
      return sendError(
        res,
        "Invalid token format. Reset token should be 5-6 digits.",
        status.BAD_REQUEST
      );
    }

    // Find verification record for password reset
    const verificationResults = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.value, trimmedToken),
          like(verification.identifier, "password-reset:%"),
          gt(verification.expiresAt, new Date())
        )
      )
      .limit(1);

    if (verificationResults.length === 0) {
      return sendError(res, "Invalid or expired reset token", status.NOT_FOUND);
    }

    const verificationRecord = verificationResults[0];
    const email = verificationRecord.identifier.replace("password-reset:", "");

    // Find user by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResults.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userResults[0].id));

    // Delete verification record
    await db
      .delete(verification)
      .where(eq(verification.id, verificationRecord.id));

    return sendSuccess(
      res,
      "Password reset successfully",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return sendError(
      res,
      "An error occurred during password reset",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
