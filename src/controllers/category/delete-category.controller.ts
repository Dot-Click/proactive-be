import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { categories } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete a category
 *     description: Delete an existing category entry (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { categoryId } = req.params;

    if (!categoryId) {
      return sendError(res, "Category ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    // Check if category exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (existingCategory.length === 0) {
      return sendError(res, "Category not found", status.NOT_FOUND);
    }

    // Delete category
    await db.delete(categories).where(eq(categories.id, categoryId));

    return sendSuccess(
      res,
      "Category deleted successfully",
      {},
      status.OK
    );
  } catch (error) {
    console.error("Delete category error:", error);
    return sendError(
      res,
      "An error occurred while deleting category",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

