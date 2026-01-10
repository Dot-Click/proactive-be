import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, verification } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { sendWelcomeEmail } from "@/utils/brevo.util";
import { verifyEmailSchema } from "@/types/auth.types";
import status from "http-status";
import { eq, sql } from "drizzle-orm";

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify email address
 *     description: Verify user's email address using verification token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: verification_token_here
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                   example: Email verified successfully
 *       400:
 *         description: Validation error or invalid token
 *       404:
 *         description: Verification token not found or expired
 *       500:
 *         description: Internal server error
 */
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = verifyEmailSchema.safeParse(req.body);
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

    const { token } = validationResult.data;
    const db = await database();

    // Trim token to handle any whitespace issues
    const trimmedToken = token.trim();

    // Validate token format (should be 5-6 digits)
    if (!/^\d{5,6}$/.test(trimmedToken)) {
      return sendError(
        res,
        "Invalid token format. Verification token should be 5-6 digits.",
        status.BAD_REQUEST
      );
    }

    // Check if user is trying to use a JWT token (common mistake)
    if (trimmedToken.startsWith("eyJ")) {
      return sendError(
        res,
        "You are using a JWT access token. Please use the verification token from your email instead.",
        status.BAD_REQUEST
      );
    }

    // Find verification record by exact token match
    const allVerificationResults = await db
      .select()
      .from(verification)
      .where(eq(verification.value, trimmedToken))
      .limit(1);

    if (allVerificationResults.length === 0) {
      return sendError(
        res,
        "Invalid verification token. Please check your token or request a new verification email.",
        status.NOT_FOUND
      );
    }

    const verificationRecord = allVerificationResults[0];

    // Check if token has expired
    if (new Date(verificationRecord.expiresAt) <= new Date()) {
      return sendError(
        res,
        "Verification token has expired. Please request a new verification email using the resend verification endpoint.",
        status.BAD_REQUEST
      );
    }

    // Find user by email (identifier stores the normalized email for email verification)
    // Use case-insensitive comparison since emails are case-insensitive
    const normalizedIdentifier = verificationRecord.identifier.toLowerCase().trim();
    const userResults = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${normalizedIdentifier}`)
      .limit(1);

    if (userResults.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    const user = userResults[0];
    const wasAlreadyVerified = user.emailVerified;

    // Update user email verification status
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, user.id));

    // Delete verification record
    await db
      .delete(verification)
      .where(eq(verification.id, verificationRecord.id));

    // Send welcome email if this is the first time verifying
    if (!wasAlreadyVerified) {
      await sendWelcomeEmail(user.email, user.firstName || undefined);
    }

    return sendSuccess(
      res,
      "Email verified successfully",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return sendError(
      res,
      "An error occurred during email verification",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
