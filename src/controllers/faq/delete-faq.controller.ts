import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { faqs } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/faqs/{faqId}:
 *   delete:
 *     tags:
 *       - FAQs
 *     summary: Delete a FAQ
 *     description: Delete an existing FAQ entry (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: faqId
 *         required: true
 *         schema:
 *           type: string
 *         description: The FAQ ID
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Internal server error
 */
export const deleteFaq = async (
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

    // Delete FAQ
    await db.delete(faqs).where(eq(faqs.id, faqId));

    return sendSuccess(
      res,
      "FAQ deleted successfully",
      {},
      status.OK
    );
  } catch (error) {
    console.error("Delete FAQ error:", error);
    return sendError(
      res,
      "An error occurred while deleting FAQ",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

