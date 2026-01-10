import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { faqs } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { createFaqSchema } from "@/types/faq.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/faqs:
 *   post:
 *     tags:
 *       - FAQs
 *     summary: Create a new FAQ
 *     description: Create a new FAQ entry (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answers
 *             properties:
 *               question:
 *                 type: string
 *                 maxLength: 1000
 *                 example: What is the return policy?
 *               answers:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Our return policy allows returns within 30 days of purchase.
 *     responses:
 *       201:
 *         description: FAQ created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export const createFaq = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const validationResult = createFaqSchema.safeParse(req.body);
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

    const { question, answers } = validationResult.data;
    const db = await database();

    // Create FAQ
    const newFaq = await db
      .insert(faqs)
      .values({
        id: createId(),
        question,
        answers,
      })
      .returning({
        id: faqs.id,
        question: faqs.question,
        answers: faqs.answers,
        createdAt: faqs.createdAt,
        updatedAt: faqs.updatedAt,
      });

    const faq = newFaq[0];

    return sendSuccess(
      res,
      "FAQ created successfully",
      { faq },
      status.CREATED
    );
  } catch (error) {
    console.error("Create FAQ error:", error);
    return sendError(
      res,
      "An error occurred while creating FAQ",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
