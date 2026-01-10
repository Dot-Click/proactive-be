import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, verification } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { sendVerificationEmail } from "@/utils/brevo.util";
import { generateVerificationToken } from "@/utils/token.util";
import { resendVerificationSchema } from "@/types/auth.types";
import status from "http-status";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend email verification
 *     description: Resend email verification token to user's email address
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
 *         description: Verification email sent successfully
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
 *                   example: Verification email sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found or email already verified
 *       500:
 *         description: Internal server error
 */
export const resendVerification = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = resendVerificationSchema.safeParse(req.body);
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

    if (userResults.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    const user = userResults[0];

    // Check if email is already verified
    if (user.emailVerified) {
      return sendError(res, "Email is already verified", status.BAD_REQUEST);
    }

    // Generate verification token (5-6 digits)
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Delete existing verification records for this email (normalize for consistency)
    const normalizedEmail = email.trim().toLowerCase();
    await db
      .delete(verification)
      .where(eq(verification.identifier, normalizedEmail));

    // Create new verification record
    await db.insert(verification).values({
      id: createId(),
      identifier: normalizedEmail, // Normalize email for consistency
      value: verificationToken, // Store token exactly as generated
      expiresAt,
    });

    // Send verification email using Brevo
    await sendVerificationEmail(
      email,
      verificationToken,
      user.firstName || undefined
    );

    return sendSuccess(
      res,
      "Verification email sent successfully",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return sendError(
      res,
      "An error occurred while sending verification email",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
