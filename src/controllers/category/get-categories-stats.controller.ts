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

    const tripsByType = await db
      .select({
        type: trips.type,
        count: sql<number>`count(*)::int`,
      })
      .from(trips)
      .groupBy(trips.type);

    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .where(eq(categories.isActive, true));

    const categoryByName = new Map<string, { id: string }>();
    for (const cat of allCategories) {
      categoryByName.set(cat.name, { id: cat.id });
    }

    const stats = tripsByType.map((row) => {
      const categoryName = row.type ?? "Other";
      const tripCount = Number(row.count);
      const percentage =
        totalTrips > 0 ? Math.round((tripCount / totalTrips) * 100 * 100) / 100 : 0;
      const category = categoryByName.get(categoryName);
      return {
        categoryId: category?.id ?? null,
        categoryName,
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
