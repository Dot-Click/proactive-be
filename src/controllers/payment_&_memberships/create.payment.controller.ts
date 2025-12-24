import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { database } from "@/configs/connection.config";
import { payments } from "@/schema/schema";
import { createId } from "@paralleldrive/cuid2";
import Stripe from "stripe";
import { createNotification } from "@/services/notifications.services";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

/**
 * @swagger
 * /api/payment:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create a new payment
 *     description: Create a new payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               return_url:
 *                 type: string
 *                 description: The URL to redirect to after the payment is complete
 *               trip_id:
 *                 type: string
 *                 description: The ID of the trip to charge for
 *     responses:
 *       200:
 *         description: Payment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export const createPayment = async (
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
      trip_id,
    } = req.body;

    if (!userId) {
      return sendError(res, "User ID not found in authentication token", 400);
    }

    if (!payment_method_id) {
      return sendError(res, "Payment method ID is required", 400);
    }

    // Retrieve payment method from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
    const paymentMethodBrand =
      paymentMethod.card?.brand?.toUpperCase() || "UNKNOWN";
    const last4 = paymentMethod.card?.last4 || "";
    const expiryDate =
      paymentMethod.card?.exp_month && paymentMethod.card?.exp_year
        ? `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`
        : "";

    // Create or retrieve Stripe customer
    const customer = await stripe.customers.create({
      email: email,
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customer.id,
      payment_method: payment_method_id,
      confirmation_method: "manual",
      confirm: true,
      return_url,
    });

    const db = await database();

    // Map payment status from Stripe to our enum
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

    // Calculate amount received (convert from cents to decimal)
    const amountReceived =
      paymentIntent.amount_received > 0
        ? paymentIntent.amount_received / 100
        : amount;

    // Insert payment into database
    const newPayment = await db
      .insert(payments)
      .values({
        id: createId(),
        userId: userId,
        tripId: trip_id || null,
        amount: amountReceived.toString(),
        status: paymentStatus,
        last4: last4 || null,
        currency: paymentIntent.currency.toUpperCase() || currency.toUpperCase(),
        method: paymentMethodBrand,
        cardExpiry: expiryDate || null,
        stripeCustomerId: customer.id,
        stripePaymentId: paymentIntent.id,
        membershipAvailable: false,
        discountAvailable: false,
      })
      .returning();

    const payment = newPayment[0];

    await createNotification({
      userId: userId,
      title: "Payment successful",
      description: "Payment successful for " + payment.tripId + " has been successful",
      type: "trip",
    });

    return sendSuccess(
      res,
      "Payment processed successfully",
      {
        paymentIntentId: payment.id,
        stripePaymentIntentId: paymentIntent.id,
        customerId: payment.stripeCustomerId,
        status: payment.status,
        amount: amountReceived,
        currency: payment.currency,
      },
      status.OK
    );
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return sendError(
      res,
      err.message || "Failed to create checkout session",
      status.INTERNAL_SERVER_ERROR
    );
  }
};



