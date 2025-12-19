import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { database } from "@/configs/connection.config";
import { payments, trips } from "@/schema/schema";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/payment:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get all payments for the authenticated user
 *     description: Retrieve all payments associated with the authenticated user, including trip information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getPayments = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "User ID not found in authentication token", 400);
    }

    const db = await database();

    // Get payments with trip information using left join (tripId can be null)
    const paymentsData = await db
      .select({
        // Payment fields
        id: payments.id,
        userId: payments.userId,
        tripId: payments.tripId,
        amount: payments.amount,
        status: payments.status,
        last4: payments.last4,
        currency: payments.currency,
        membershipType: payments.membershipType,
        membershipExpiry: payments.membershipExpiry,
        method: payments.method,
        cardExpiry: payments.cardExpiry,
        stripeCustomerId: payments.stripeCustomerId,
        membershipId: payments.membershipId,
        membershipAvailable: payments.membershipAvailable,
        discountAvailable: payments.discountAvailable,
        validTill: payments.validTill,
        stripePaymentId: payments.stripePaymentId,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        // Trip fields (can be null)
        tripIdFromTrips: trips.id,
        tripTitle: trips.title,
        tripEndDate: trips.endDate,
      })
      .from(payments)
      .leftJoin(trips, eq(payments.tripId, trips.id))
      .where(eq(payments.userId, userId));

    // Format the response to match the expected structure
    const formattedPayments = paymentsData.map((payment) => ({
      id: payment.id,
      userId: payment.userId,
      tripId: payment.tripId,
      amount: payment.amount,
      status: payment.status,
      last4: payment.last4,
      currency: payment.currency,
      membershipType: payment.membershipType,
      membershipExpiry: payment.membershipExpiry,
      method: payment.method,
      cardExpiry: payment.cardExpiry,
      stripeCustomerId: payment.stripeCustomerId,
      membershipId: payment.membershipId,
      membershipAvailable: payment.membershipAvailable,
      discountAvailable: payment.discountAvailable,
      validTill: payment.validTill,
      stripePaymentId: payment.stripePaymentId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      trip: payment.tripIdFromTrips
        ? {
            id: payment.tripIdFromTrips,
            title: payment.tripTitle,
            end_date: payment.tripEndDate,
          }
        : null,
    }));

    return sendSuccess(
      res,
      "Payments retrieved successfully",
      { payments: formattedPayments },
      status.OK
    );
  } catch (err: any) {
    console.error("Error getting payments:", err);
    return sendError(
      res,
      err.message || "Failed to get payments",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

