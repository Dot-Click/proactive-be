import { database } from "@/configs/connection.config";
import { discounts } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/discounts/{id}:
 *   put:
 *     tags:
 *       - Discounts
 *     summary: Update a discount code
 *     description: Update an existing discount code's details.
 *     security:
 *       - bearerAuth: []
 */
export const updateDiscount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const {
      tripId,
      discountCode,
      validTill,
      description,
      discountPercentage,
      amount,
      maxUsage,
      status: discountStatus,
    } = req.body;

    if (!id) {
      return sendError(res, "Discount ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    // Check if discount exists
    const existing = await db.query.discounts.findFirst({
      where: eq(discounts.id, id),
    });

    if (!existing) {
      return sendError(res, "Discount not found", status.NOT_FOUND);
    }

    const updatedData: any = {};
    if (tripId !== undefined) updatedData.tripId = tripId === "global" ? null : tripId;
    if (discountCode !== undefined) updatedData.discountCode = discountCode.trim().toUpperCase();
    if (validTill !== undefined) {
        const date = new Date(validTill);
        date.setHours(23, 59, 59, 999);
        updatedData.validTill = date;
    }
    if (description !== undefined) updatedData.description = description;
    if (discountPercentage !== undefined) updatedData.discountPercentage = discountPercentage.toString();
    if (amount !== undefined) updatedData.amount = amount.toString();
    if (maxUsage !== undefined) updatedData.maxUsage = maxUsage.toString();
    if (discountStatus !== undefined) updatedData.status = discountStatus;

    const [updatedDiscount] = await db
      .update(discounts)
      .set(updatedData)
      .where(eq(discounts.id, id))
      .returning();

    return sendSuccess(res, "Discount updated successfully", updatedDiscount);
  } catch (error) {
    console.error("Update discount error:", error);
    return sendError(
      res,
      "An error occurred while updating the discount",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
