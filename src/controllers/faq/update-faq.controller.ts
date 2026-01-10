import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { faqs } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { updateFaqSchema } from "@/types/faq.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/faqs/{faqId}:
 *   put:
 *     tags:
 *       - FAQs
 *     summary: Update a FAQ
 *     description: Update an existing FAQ entry (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: faqId
 *         required: true
 *         schema:
 *           type: string
 *         description: The FAQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 maxLength: 1000
 *                 example: What is the updated return policy?
 *               answers:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Our updated return policy allows returns within 45 days of purchase.
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Internal server error
 */
export const updateFaq = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { faqId } = req.params;

    if (!faqId) {
      return sendError(res, "FAQ ID is required", status.BAD_REQUEST);
    }

    const validationResult = updateFaqSchema.safeParse(req.body);
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

    const updateData = validationResult.data;
    const db = await database();

    // Check if FAQ exists
    const existingFaq = await db
      .select()
      .from(faqs)
      .where(eq(faqs.id, faqId))
      .limit(1);

    if (existingFaq.length === 0) {
      return sendError(res, "FAQ not found", status.NOT_FOUND);
    }

    // Update FAQ
    const updatedFaq = await db
      .update(faqs)
      .set(updateData)
      .where(eq(faqs.id, faqId))
      .returning({
        id: faqs.id,
        question: faqs.question,
        answers: faqs.answers,
        createdAt: faqs.createdAt,
        updatedAt: faqs.updatedAt,
      });

    const faq = updatedFaq[0];

    return sendSuccess(
      res,
      "FAQ updated successfully",
      { faq },
      status.OK
    );
  } catch (error) {
    console.error("Update FAQ error:", error);
    return sendError(
      res,
      "An error occurred while updating FAQ",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

