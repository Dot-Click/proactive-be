import { Response } from "express";
import { database } from "@/configs/connection.config";
import { faqs } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { desc } from "drizzle-orm";

/**
 * @swagger
 * /api/faqs:
 *   get:
 *     tags:
 *       - FAQs
 *     summary: Get all FAQs
 *     description: Retrieve all FAQs (Public endpoint)
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: FAQs retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     faqs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           question:
 *                             type: string
 *                           answers:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       500:
 *         description: Internal server error
 */
export const getFaqs = async (
  // req: Request,
  res: Response
): Promise<Response> => {
  try {
    const db = await database();

    // Get all FAQs ordered by creation date (newest first)
    const allFaqs = await db
      .select({
        id: faqs.id,
        question: faqs.question,
        answers: faqs.answers,
        createdAt: faqs.createdAt,
        updatedAt: faqs.updatedAt,
      })
      .from(faqs)
      .orderBy(desc(faqs.createdAt));

    return sendSuccess(
      res,
      "FAQs retrieved successfully",
      { faqs: allFaqs },
      status.OK
    );
  } catch (error) {
    console.error("Get FAQs error:", error);
    return sendError(
      res,
      "An error occurred while retrieving FAQs",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
