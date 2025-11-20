import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { faqs } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/faqs/{faqId}:
 *   get:
 *     tags:
 *       - FAQs
 *     summary: Get a specific FAQ
 *     description: Retrieve a single FAQ by ID (Public endpoint)
 *     parameters:
 *       - in: path
 *         name: faqId
 *         required: true
 *         schema:
 *           type: string
 *         description: The FAQ ID
 *     responses:
 *       200:
 *         description: FAQ retrieved successfully
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
 *                   example: FAQ retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     faq:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         question:
 *                           type: string
 *                         answers:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Internal server error
 */
export const getFaq = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { faqId } = req.params;

    if (!faqId) {
      return sendError(res, "FAQ ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    // Get FAQ by ID
    const faqResults = await db
      .select({
        id: faqs.id,
        question: faqs.question,
        answers: faqs.answers,
        createdAt: faqs.createdAt,
        updatedAt: faqs.updatedAt,
      })
      .from(faqs)
      .where(eq(faqs.id, faqId))
      .limit(1);

    if (faqResults.length === 0) {
      return sendError(res, "FAQ not found", status.NOT_FOUND);
    }

    const faq = faqResults[0];

    return sendSuccess(
      res,
      "FAQ retrieved successfully",
      { faq },
      status.OK
    );
  } catch (error) {
    console.error("Get FAQ error:", error);
    return sendError(
      res,
      "An error occurred while retrieving FAQ",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

