import { database } from "@/configs/connection.config";
import { payments } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { and, eq, gte } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/user/membership/{userId}:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user membership status
 *     description: Activate or remove user membership.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [activate, remove]
 */
export const updateMembership = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { action } = req.body;

    if (!["activate", "remove"].includes(action)) {
      return sendError(res, "Invalid action", status.BAD_REQUEST);
    }

    const db = await database();
    const now = new Date();

    if (action === "activate") {
      // Create or update membership to be active for 1 year
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      await db.insert(payments).values({
        id: createId(),
        userId: userId,
        amount: "0",
        currency: "EUR",
        status: "paid",
        method: "admin_activation",
        stripePaymentId: `manual_${createId()}`,
        membershipType: "admin_activated",
        membershipExpiry: expiry,
        membershipId: `PA-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
        membershipAvailable: true,
      });

      return sendSuccess(res, "Membership activated successfully");
    } else {
      // Expire all active memberships
      await db
        .update(payments)
        .set({ membershipExpiry: new Date(now.getTime() - 1000) })
        .where(
          and(
            eq(payments.userId, userId),
            eq(payments.status, "paid"),
            gte(payments.membershipExpiry, now)
          )
        );

      return sendSuccess(res, "Membership removed successfully");
    }
  } catch (error) {
    console.error("Update membership error:", error);
    return sendError(
      res,
      "An error occurred while updating membership",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
