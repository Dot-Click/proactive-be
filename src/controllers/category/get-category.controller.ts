import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { categories } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get a specific category
 *     description: Retrieve a single category by ID (Public endpoint)
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
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
 *                   example: Category retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export const getCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return sendError(res, "Category ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    // Get category by ID
    const categoryResults = await db
      .select({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (categoryResults.length === 0) {
      return sendError(res, "Category not found", status.NOT_FOUND);
    }

    const category = categoryResults[0];

    return sendSuccess(
      res,
      "Category retrieved successfully",
      { category },
      status.OK
    );
  } catch (error) {
    console.error("Get category error:", error);
    return sendError(
      res,
      "An error occurred while retrieving category",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

