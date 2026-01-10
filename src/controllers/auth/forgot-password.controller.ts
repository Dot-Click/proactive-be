import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, verification } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { sendPasswordResetEmail } from "@/utils/brevo.util";
import { generateVerificationToken } from "@/utils/token.util";
import { forgotPasswordSchema } from "@/types/auth.types";
import status from "http-status";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Send password reset token to user's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
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
 *                   example: Password reset email sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = forgotPasswordSchema.safeParse(req.body);
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

    const { email } = validationResult.data;
    const db = await database();

    // Find user by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    // In production, you might want to log failed attempts
    if (userResults.length === 0) {
      return sendSuccess(
        res,
        "If an account with that email exists, a password reset link has been sent",
        undefined,
        status.OK
      );
    }

    // Generate reset token (5-6 digits)
    const resetToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete existing reset tokens for this email
    await db
      .delete(verification)
      .where(eq(verification.identifier, `password-reset:${email}`));

    // Create new verification record for password reset
    await db.insert(verification).values({
      id: createId(),
      identifier: `password-reset:${email}`,
      value: resetToken,
      expiresAt,
    });

    // Send password reset email using Brevo
    const user = userResults[0];
    await sendPasswordResetEmail(
      email,
      resetToken,
      user.firstName || undefined
    );

    return sendSuccess(
      res,
      "Password reset link has been sent To Yout Email",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return sendError(
      res,
      "An error occurred while processing password reset request",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

