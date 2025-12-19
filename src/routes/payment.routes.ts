import { createMembership } from "@/controllers/payment_&_memberships/create.membership.controller";
import { createPayment } from "@/controllers/payment_&_memberships/create.payment.controller";
import { getPayments } from "@/controllers/payment_&_memberships/get.payments.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { Router } from "express";

const paymentRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: Payment management endpoints
 */

/**
 * @swagger
 * /api/payment:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create a new payment
 *     description: Create a new payment using Stripe payment method
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
paymentRoutes.post("/",authenticate,  createPayment);

/**
 * @swagger
 * /api/payment/membership:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Create a new membership
 *     description: Create a new membership with payment processing. Membership expires 1 year from creation date.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MembershipRequest'
 *     responses:
 *       200:
 *         description: Membership created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MembershipResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
paymentRoutes.post("/membership", authenticate, createMembership);


/**
 * @swagger
 * /api/payment:
 *   get:
 *     tags:
 *       - Payment
 *     summary: Get all payments for authenticated user
 *     description: Retrieve all payments associated with the authenticated user, including trip information if available. Admin users can see all payments.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentsListResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
paymentRoutes.get("/", authenticate, authorize("admin"), getPayments);

export default paymentRoutes;