import { database } from "@/configs/connection.config";
import { discounts } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";

import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     tags:
 *       - Discounts
 *     summary: Create a new discount code
 *     description: Create a discount code for a specific trip. Percentage or amount can be provided.
 *     security:
 *       - bearerAuth: []
 */
export const createDiscount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      tripId,
      discountCode,
      validTill,
      description,
      discountPercentage,
      amount,
      maxUsage,
    } = req.body;

    if (!discountCode || !validTill || !description) {
      return sendError(res, "Missing required fields", status.BAD_REQUEST);
    }

    const db = await database();

    const [newDiscount] = await db
      .insert(discounts)
      .values({
        id: createId(),
        tripId,
        discountCode,
        validTill: (() => {
          const date = new Date(validTill);
          date.setHours(23, 59, 59, 999);
          return date;
        })(),
        description,
        discountPercentage: (discountPercentage || 0).toString(),
        amount: (amount || 0).toString(),
        maxUsage: (maxUsage || 0).toString(),
        status: "active",
      })
      .returning();

    return sendSuccess(
      res,
      "Discount created successfully",
      newDiscount,
      status.CREATED
    );
  } catch (error) {
    console.error("Create discount error details:", error);
    return sendError(
      res,
      `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
      status.INTERNAL_SERVER_ERROR
    );
  }
};
