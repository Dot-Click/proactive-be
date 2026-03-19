import { database } from "@/configs/connection.config";
import { discounts } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { and, eq, lte, gte, or, isNull } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/discounts/validate:
 *   post:
 *     tags:
 *       - Discounts
 *     summary: Validate a discount code
 *     description: Check if a discount code is valid for a given trip. Returns discount details if valid.
 */
export const validateDiscount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { tripId, discountCode } = req.body;

    if (!tripId || !discountCode) {
      return sendError(res, "Trip ID and Discount Code are required", status.BAD_REQUEST);
    }

    const db = await database();
    const now = new Date();

    const whereClause = tripId 
      ? and(
          eq(discounts.discountCode, discountCode),
          or(eq(discounts.tripId, tripId), isNull(discounts.tripId)),
          eq(discounts.status, "active"),
          gte(discounts.validTill, now)
        )
      : and(
          eq(discounts.discountCode, discountCode),
          isNull(discounts.tripId),
          eq(discounts.status, "active"),
          gte(discounts.validTill, now)
        );

    const [discount] = await db
      .select()
      .from(discounts)
      .where(whereClause);

    if (!discount) {
      return sendError(
        res,
        "Invalid or expired discount code for this trip",
        status.NOT_FOUND
      );
    }

    return sendSuccess(res, "Discount code is valid", discount);
  } catch (error) {
    console.error("Validate discount error:", error);
    return sendError(
      res,
      "An error occurred while validating the discount",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
