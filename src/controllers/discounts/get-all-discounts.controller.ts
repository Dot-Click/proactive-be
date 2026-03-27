import { database } from "@/configs/connection.config";
import { discounts, trips, payments } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq, desc, sql } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     tags:
 *       - Discounts
 *     summary: Get all discounts (Admin)
 *     description: Retrieve all discount codes across all trips and global.
 */
export const getAllDiscounts = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const db = await database();
    
    // Join with trips to get trip titles if available
    const result = await db
      .select({
        id: discounts.id,
        tripId: discounts.tripId,
        tripTitle: trips.title,
        validTill: discounts.validTill,
        status: discounts.status,
        discountCode: discounts.discountCode,
        description: discounts.description,
        discountPercentage: discounts.discountPercentage,
        amount: discounts.amount,
        maxUsage: discounts.maxUsage,
        currentUsage: sql`count(${payments.id})`.mapWith(Number),
        createdAt: discounts.createdAt,
      })
      .from(discounts)
      .leftJoin(trips, eq(discounts.tripId, trips.id))
      .leftJoin(payments, eq(discounts.id, payments.discountId))
      .groupBy(discounts.id, trips.id)
      .orderBy(desc(discounts.createdAt));

    return sendSuccess(res, "All discounts retrieved successfully", result);
  } catch (error) {
    console.error("Get all discounts error:", error);
    return sendError(
      res,
      "An error occurred while fetching the discounts",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
