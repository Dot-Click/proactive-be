import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { categories } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { updateCategorySchema } from "@/types/category.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update a category
 *     description: Update an existing category entry (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: Updated Electronics
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export const updateCategory = async (
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

    const validationResult = updateCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        errors
      );
    }

    const updateData = validationResult.data;
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

    // Update category
    const updatedCategory = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      });

    const category = updatedCategory[0];

    return sendSuccess(
      res,
      "Category updated successfully",
      { category },
      status.OK
    );
  } catch (error) {
    console.error("Update category error:", error);
    return sendError(
      res,
      "An error occurred while updating category",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

