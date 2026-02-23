import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { database } from "@/configs/connection.config";
import { payments, trips, discounts, users } from "@/schema/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

/**
 * Get payments for the authenticated user (trip payments + membership)
 */
export const getMyPayments = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const userId = (req.user as any).userId;
    const db = await database();

    const paymentsData = await db
      .select({
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
        validTill: payments.validTill,
        stripePaymentId: payments.stripePaymentId,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        tripIdFromTrips: trips.id,
        tripTitle: trips.title,
        tripStartDate: trips.startDate,
        tripEndDate: trips.endDate,
        discountId: discounts.id,
        discountCode: discounts.discountCode,
        discountDescription: discounts.description,
        discountPercentage: discounts.discountPercentage,
        discountAmount: discounts.amount,
        discountValidTill: discounts.validTill,
        discountStatus: discounts.status,
        discountMaxUsage: discounts.maxUsage,
      })
      .from(payments)
      .leftJoin(trips, eq(payments.tripId, trips.id))
      .leftJoin(
        discounts,
        and(
          eq(trips.id, discounts.tripId),
          eq(discounts.status, "active"),
          gte(discounts.validTill, sql`NOW()`)
        )
      )
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));

    const tripPayments: any[] = [];
    const membershipPayments: any[] = [];

    paymentsData.forEach((payment) => {
      const formattedPayment: any = {
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
        validTill: payment.validTill,
        stripePaymentId: payment.stripePaymentId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };

      const isMembershipPayment =
        payment.membershipType || payment.membershipId || payment.membershipAvailable || payment.membershipExpiry;

      const isTripPayment = payment.tripId && payment.tripIdFromTrips;

      if (isMembershipPayment) {
        membershipPayments.push(formattedPayment);
      } else if (isTripPayment) {
        tripPayments.push({
          ...formattedPayment,
          trip: {
            id: payment.tripIdFromTrips,
            title: payment.tripTitle,
            startDate: payment.tripStartDate,
            endDate: payment.tripEndDate,
            discount: payment.discountId
              ? {
                  id: payment.discountId,
                  code: payment.discountCode,
                  description: payment.discountDescription,
                  percentage: payment.discountPercentage,
                  amount: payment.discountAmount,
                  validTill: payment.discountValidTill,
                  status: payment.discountStatus,
                  maxUsage: payment.discountMaxUsage,
                }
              : null,
          },
        });
      } else if (payment.tripId) {
        tripPayments.push({ ...formattedPayment, trip: null });
      } else {
        membershipPayments.push(formattedPayment);
      }
    });

    // Keep discounts minimal (for UI if needed)
    const discountsResp: any[] = [];

    return sendSuccess(res, "User payments retrieved successfully", { tripPayments, membershipPayments, discounts: discountsResp }, status.OK);
  } catch (err: any) {
    console.error("Error getting user payments:", err);
    return sendError(res, err.message || "Failed to get user payments", status.INTERNAL_SERVER_ERROR);
  }
};
