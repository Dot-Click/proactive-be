import { database } from "@/configs/connection.config";
import { discounts } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/discounts/{id}:
 *   delete:
 *     tags:
 *       - Discounts
 *     summary: Delete a discount code
 */
export const deleteDiscount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendError(res, "Discount ID is required", status.BAD_REQUEST);
    }

    const db = await database();
    const [deleted] = await db
      .delete(discounts)
      .where(eq(discounts.id, id))
      .returning();

    if (!deleted) {
      return sendError(res, "Discount not found", status.NOT_FOUND);
    }

    return sendSuccess(res, "Discount deleted successfully", deleted);
  } catch (error) {
    console.error("Delete discount error:", error);
    return sendError(
      res,
      "An error occurred while deleting the discount",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
