import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { database } from "@/configs/connection.config";
import { payments } from "@/schema/schema";
import { createId } from "@paralleldrive/cuid2";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

/**
 * @swagger
 * /api/payment/membership:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create a new membership
 *     description: Create a new membership with payment processing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method_id
 *               - membership_type
 *             properties:
 *               payment_method_id:
 *                 type: string
 *                 description: The ID of the payment method to use
 *               amount:
 *                 type: number
 *                 description: The amount to charge
 *               currency:
 *                 type: string
 *                 description: The currency to charge in
 *                 default: eur
 *               return_url:
 *                 type: string
 *                 description: The URL to redirect to after the payment is complete
 *               membership_type:
 *                 type: string
 *                 description: The type of membership
 *               trip_id:
 *                 type: string
 *                 description: Optional trip ID associated with the membership
 *     responses:
 *       200:
 *         description: Membership created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const createMembership = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const email = req.user?.email;
    const userId = req.user?.userId;

    const {
      payment_method_id,
      amount,
      currency = "eur",
      return_url,
      membership_type,
    } = req.body;

    if (!userId) {
      return sendError(res, "User ID not found in authentication token", 400);
    }

    if (!payment_method_id) {
      return sendError(res, "Payment method ID is required", 400);
    }

    if (!membership_type) {
      return sendError(res, "Membership type is required", 400);
    }

    if (!amount || amount <= 0) {
      return sendError(res, "Valid amount is required", 400);
    }


    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
    const paymentMethodBrand =
      paymentMethod.card?.brand?.toUpperCase() || "UNKNOWN";
    const last4 = paymentMethod.card?.last4 || "";
    const expiryDate =
      paymentMethod.card?.exp_month && paymentMethod.card?.exp_year
        ? `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`
        : "";


    const customer = await stripe.customers.create({
      email: email,
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      customer: customer.id,
      payment_method: payment_method_id,
      confirmation_method: "manual",
      confirm: true,
      return_url,
    });

    const db = await database();

    let paymentStatus: "paid" | "unpaid" | "pending" | "failed" | "refunded" =
      "pending";
    if (paymentIntent.status === "succeeded") {
      paymentStatus = "paid";
    } else if (paymentIntent.status === "requires_payment_method") {
      paymentStatus = "failed";
    } else if (
      paymentIntent.status === "requires_confirmation" ||
      paymentIntent.status === "requires_action"
    ) {
      paymentStatus = "pending";
    } else if (paymentIntent.status === "canceled") {
      paymentStatus = "failed";
    }


    const amountReceived =
      paymentIntent.amount_received > 0
        ? paymentIntent.amount_received / 100
        : amount;

    // Generate membership ID: PA-XXXXXX (6 digits)
    const membershipId = `PA-${Math.floor(100000 + Math.random() * 900000)}`;

    const membershipExpiry = new Date();
    membershipExpiry.setFullYear(membershipExpiry.getFullYear() + 1);

    const newMembership = await db
      .insert(payments)
      .values({
        id: createId(),
        userId: userId,
        amount: amountReceived.toString(),
        status: paymentStatus,
        last4: last4 || null,
        currency: paymentIntent.currency.toUpperCase() || currency.toUpperCase(),
        membershipType: membership_type,
        membershipExpiry: membershipExpiry,
        method: paymentMethodBrand,
        cardExpiry: expiryDate || null,
        stripeCustomerId: customer.id,
        membershipId: membershipId,
        stripePaymentId: paymentIntent.id,
        membershipAvailable: true,
        discountAvailable: false,
      })
      .returning();

    const membership = newMembership[0];

    return sendSuccess(
      res,
      "Membership created successfully",
      {
        membershipId: membership.membershipId,
        paymentId: membership.id,
        stripePaymentIntentId: paymentIntent.id,
        customerId: membership.stripeCustomerId,
        status: membership.status,
        membershipType: membership.membershipType,
        membershipExpiry: membership.membershipExpiry,
        amount: amountReceived,
        currency: membership.currency,
        membershipAvailable: membership.membershipAvailable,
      },
      status.OK
    );
  } catch (err: any) {
    console.error("Error creating membership:", err);
    return sendError(
      res,
      err.message || "Failed to create membership",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
