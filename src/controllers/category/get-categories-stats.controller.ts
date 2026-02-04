import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { categories, trips } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { eq, sql } from "drizzle-orm";

/**
 * @swagger
 * /api/categories/stats:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get categories statistics
 *     description: Returns trip count and percentage per category (trips grouped by category type relative to total trips). Public endpoint.
 *     responses:
 *       200:
 *         description: Categories stats retrieved successfully
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
 *                   example: "Categories stats retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTrips:
 *                       type: integer
 *                       description: Total number of trips
 *                     stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoryId:
 *                             type: string
 *                             description: Category ID (null if type does not match a category)
 *                           categoryName:
 *                             type: string
 *                             description: Category or trip type name
 *                           tripCount:
 *                             type: integer
 *                             description: Number of trips in this category
 *                           percentage:
 *                             type: number
 *                             description: Percentage of total trips (0-100)
 *       500:
 *         description: Internal server error
 */
export const getCategoriesStats = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const db = await database();

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trips);
    const totalTrips = Number(totalResult?.count) || 0;

    const tripsByCategory = await db
      .select({
        categoryId: trips.categoryId,
        categoryName: categories.name,
        count: sql<number>`count(*)::int`,
      })
      .from(trips)
      .leftJoin(categories, eq(trips.categoryId, categories.id))
      .groupBy(trips.categoryId, categories.name);

    const stats = tripsByCategory.map((row) => {
      const tripCount = Number(row.count);
      const percentage =
        totalTrips > 0
          ? Math.round((tripCount / totalTrips) * 100 * 100) / 100
          : 0;
      return {
        categoryId: row.categoryId ?? null,
        categoryName: row.categoryName ?? "Other",
        tripCount,
        percentage,
      };
    });

    return sendSuccess(
      res,
      "Categories stats retrieved successfully",
      { totalTrips, stats },
      status.OK
    );
  } catch (error) {
    console.error("Get categories stats error:", error);
    return sendError(
      res,
      "An error occurred while retrieving categories stats",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
