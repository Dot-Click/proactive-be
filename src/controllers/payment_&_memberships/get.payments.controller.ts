import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { database } from "@/configs/connection.config";
import { payments, trips, discounts } from "@/schema/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * @swagger
 * /api/payment:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get all payments (Admin)
 *     description: Retrieve all payments for all users, including trip information and membership data
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
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const db = await database();

    // Get all payments with trip information and discounts using left joins (admin view - no user filter)
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
        // Discount fields (can be null)
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
      );

    // Get all active discounts for trips (separate query)
    const allDiscounts = await db
      .select({
        id: discounts.id,
        tripId: discounts.tripId,
        code: discounts.discountCode,
        description: discounts.description,
        percentage: discounts.discountPercentage,
        amount: discounts.amount,
        validTill: discounts.validTill,
        status: discounts.status,
        maxUsage: discounts.maxUsage,
        tripTitle: trips.title,
      })
      .from(discounts)
      .leftJoin(trips, eq(discounts.tripId, trips.id))
      .where(
        and(
          eq(discounts.status, "active"),
          gte(discounts.validTill, sql`NOW()`)
        )
      );

    // Format payments and separate into trip payments and membership payments
    const tripPayments: any[] = [];
    const membershipPayments: any[] = [];

    // Debug: Log all payment IDs to see what we're getting
    console.log("Total payments fetched:", paymentsData.length);
    console.log("Payment IDs:", paymentsData.map((p) => p.id));

    paymentsData.forEach((payment) => {
      const formattedPayment = {
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
        discountAvailable: payment.discountId ? true : false,
        validTill: payment.validTill,
        stripePaymentId: payment.stripePaymentId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      };

      // Check if this is the specific payment we're looking for
      if (payment.id === "osd3a6py8bu7coattuhmtg0s") {
        console.log("Found payment osd3a6py8bu7coattuhmtg0s - Full details:", {
          tripId: payment.tripId,
          membershipType: payment.membershipType,
          membershipId: payment.membershipId,
          membershipAvailable: payment.membershipAvailable,
          membershipExpiry: payment.membershipExpiry,
          tripIdFromTrips: payment.tripIdFromTrips,
          status: payment.status,
        });
      }

      // Separate trip payments from membership payments
      // Check if it's a membership payment by checking multiple fields
      const isMembershipPayment =
        payment.membershipType ||
        payment.membershipId ||
        payment.membershipAvailable ||
        payment.membershipExpiry;

      // Check if it's a trip payment
      const isTripPayment = payment.tripId && payment.tripIdFromTrips;

      if (isMembershipPayment) {
        // Membership payment (can also have tripId, but membership takes priority)
        membershipPayments.push(formattedPayment);
      } else if (isTripPayment) {
        // Trip payment (no membership type)
        tripPayments.push({
          ...formattedPayment,
          trip: {
            id: payment.tripIdFromTrips,
            title: payment.tripTitle,
            end_date: payment.tripEndDate,
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
        // Trip payment but trip doesn't exist in trips table
        tripPayments.push({
          ...formattedPayment,
          trip: null,
        });
      } else {
        // Payment with no tripId and no membership fields - treat as membership if no trip data
        // This catches edge cases where membership fields might not be set properly
        console.warn(
          `Payment ${payment.id} doesn't match trip or membership criteria. Adding to membershipPayments as fallback.`,
          {
            tripId: payment.tripId,
            membershipType: payment.membershipType,
            membershipId: payment.membershipId,
            membershipAvailable: payment.membershipAvailable,
            membershipExpiry: payment.membershipExpiry,
          }
        );
        membershipPayments.push(formattedPayment);
      }
    });

    console.log("Trip payments count:", tripPayments.length);
    console.log("Membership payments count:", membershipPayments.length);
    console.log("Membership payment IDs:", membershipPayments.map((p) => p.id));

    // Format discounts array
    const formattedDiscounts = allDiscounts.map((discount) => ({
      id: discount.id,
      tripId: discount.tripId,
      tripTitle: discount.tripTitle,
      code: discount.code,
      description: discount.description,
      percentage: discount.percentage,
      amount: discount.amount,
      validTill: discount.validTill,
      status: discount.status,
      maxUsage: discount.maxUsage,
    }));

    // Calculate membership key states/metrics
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Filter active memberships (membershipAvailable = true and expiry in future)
    const activeMemberships = membershipPayments.filter(
      (payment) =>
        payment.membershipAvailable &&
        payment.membershipExpiry &&
        new Date(payment.membershipExpiry) > now
    );

    // Calculate total active memberships
    const totalActiveMemberships = activeMemberships.length;

    // Calculate expiring soon (within 30 days)
    const expiringSoon = activeMemberships.filter(
      (payment) =>
        payment.membershipExpiry &&
        new Date(payment.membershipExpiry) > now &&
        new Date(payment.membershipExpiry) <= thirtyDaysFromNow
    ).length;

    // Calculate average duration in days
    let totalDurationDays = 0;
    let validDurationsCount = 0;
    activeMemberships.forEach((payment) => {
      if (payment.membershipExpiry && payment.createdAt) {
        const expiryDate = new Date(payment.membershipExpiry);
        const createdDate = new Date(payment.createdAt);
        const durationDays = Math.ceil(
          (expiryDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (durationDays > 0) {
          totalDurationDays += durationDays;
          validDurationsCount++;
        }
      }
    });
    const averageDurationDays =
      validDurationsCount > 0
        ? Math.round(totalDurationDays / validDurationsCount)
        : 0;

    // Calculate monthly renewals (expiring in current month)
    const monthlyRenewals = activeMemberships.filter(
      (payment) =>
        payment.membershipExpiry &&
        new Date(payment.membershipExpiry) >= startOfCurrentMonth &&
        new Date(payment.membershipExpiry) <= endOfCurrentMonth
    ).length;

    const membershipKeyStates = {
      totalActiveMemberships,
      expiringSoon,
      averageDuration: `${averageDurationDays} days`,
      monthlyRenewals,
    };

    return sendSuccess(
      res,
      "Payments retrieved successfully",
      {
        tripPayments,
        membershipPayments: {
          payments: membershipPayments,
          keyStates: membershipKeyStates,
        },
        discounts: formattedDiscounts,
      },
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

