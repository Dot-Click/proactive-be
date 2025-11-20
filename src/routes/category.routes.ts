import { Router } from "express";
import { createCategory } from "@/controllers/category/create-category.controller";
import { getCategories } from "@/controllers/category/get-categories.controller";
import { getCategory } from "@/controllers/category/get-category.controller";
import { updateCategory } from "@/controllers/category/update-category.controller";
import { deleteCategory } from "@/controllers/category/delete-category.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const categoryRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management endpoints
 */

// Public routes - anyone can view categories
/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     description: Retrieve all categories (Public endpoint)
 */
categoryRoutes.get("/", getCategories);

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get a specific category
 *     description: Retrieve a single category by ID (Public endpoint)
 */
categoryRoutes.get("/:categoryId", getCategory);

// Admin-only routes
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
 */
categoryRoutes.post("/", authenticate, authorize("admin"), createCategory);

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
 */
categoryRoutes.put(
  "/:categoryId",
  authenticate,
  authorize("admin"),
  updateCategory
);

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
 */
categoryRoutes.delete(
  "/:categoryId",
  authenticate,
  authorize("admin"),
  deleteCategory
);

export default categoryRoutes;
