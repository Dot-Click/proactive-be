import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { categories } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { createCategorySchema } from "@/types/category.types";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a new category
 *     description: Create a new category entry (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: Electronics
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export const createCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const validationResult = createCategorySchema.safeParse(req.body);
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

    const { name, isActive = true } = validationResult.data;
    const db = await database();

    // Create category
    const newCategory = await db
      .insert(categories)
      .values({
        id: createId(),
        name,
        isActive,
      })
      .returning({
        id: categories.id,
        name: categories.name,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      });

    const category = newCategory[0];

    return sendSuccess(
      res,
      "Category created successfully",
      { category },
      status.CREATED
    );
  } catch (error) {
    console.error("Create category error:", error);
    return sendError(
      res,
      "An error occurred while creating category",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

