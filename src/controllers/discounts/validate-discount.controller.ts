import { database } from "@/configs/connection.config";
import { discounts, payments } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { and, eq, lte, gte, or, isNull, sql } from "drizzle-orm";
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
    const normalizedCode = discountCode.trim().toUpperCase();

    const whereClause = tripId 
      ? and(
          eq(discounts.discountCode, normalizedCode),
          or(eq(discounts.tripId, tripId), isNull(discounts.tripId)),
          eq(discounts.status, "active"),
          gte(discounts.validTill, sql`NOW()`)
        )
      : and(
          eq(discounts.discountCode, normalizedCode),
          isNull(discounts.tripId),
          eq(discounts.status, "active"),
          gte(discounts.validTill, sql`NOW()`)
        );

    const [discount] = await db
      .select({
        id: discounts.id,
        tripId: discounts.tripId,
        validTill: discounts.validTill,
        status: discounts.status,
        discountCode: discounts.discountCode,
        discountPercentage: discounts.discountPercentage,
        amount: discounts.amount,
        maxUsage: discounts.maxUsage,
        currentUsage: sql`count(${payments.id})`.mapWith(Number),
      })
      .from(discounts)
      .leftJoin(payments, eq(discounts.id, payments.discountId))
      .where(whereClause)
      .groupBy(discounts.id);

    if (!discount) {
      return sendError(
        res,
        "Invalid or expired discount code for this trip",
        status.NOT_FOUND
      );
    }

    // Check usage limit
    const maxUsage = parseInt(discount.maxUsage as string) || 0;
    if (maxUsage > 0 && discount.currentUsage >= maxUsage) {
      return sendError(
        res,
        "This discount code has reached its maximum usage limit",
        status.BAD_REQUEST
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
