import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { newsletterSubscribers } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * @swagger
 * /api/user/subscribe:
 *   post:
 *     tags:
 *       - User
 *     summary: Subscribe to newsletter
 *     description: Add email to newsletter subscribers. No auth required.
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
 *     responses:
 *       200:
 *         description: Subscribed successfully
 *       400:
 *         description: Invalid email or already subscribed
 *       500:
 *         description: Internal server error
 */
export const subscribeNewsletter = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.message ?? "Invalid request";
      return sendError(res, message, status.BAD_REQUEST);
    }
    const { email } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const db = await database();
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return sendSuccess(
        res,
        "You're already subscribed to our newsletter.",
        undefined,
        status.OK
      );
    }

    await db.insert(newsletterSubscribers).values({
      id: createId(),
      email: normalizedEmail,
    });

    return sendSuccess(
      res,
      "Thank you for subscribing! You'll receive our latest adventures and offers.",
      undefined,
      status.CREATED
    );
  } catch (error) {
    console.error("Subscribe newsletter error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to subscribe",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
