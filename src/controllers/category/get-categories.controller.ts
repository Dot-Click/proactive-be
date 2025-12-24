import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { categories } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { desc } from "drizzle-orm";

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     description: Retrieve all categories (Public endpoint)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       500:
 *         description: Internal server error
 */
export const getCategories = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const db = await database();

    // Get all categories ordered by creation date (newest first)
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .orderBy(desc(categories.createdAt));

    return sendSuccess(
      res,
      "Categories retrieved successfully",
      { categories: allCategories },
      status.OK
    );
  } catch (error) {
    console.error("Get categories error:", error);
    return sendError(
      res,
      "An error occurred while retrieving categories",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
