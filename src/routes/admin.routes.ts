import { toggleCoordinatorStatus } from "@/controllers/admin/block.coordinator.controller";
import { createCoordinator } from "@/controllers/admin/create.coordinator.controller";
import { dashboardlogic } from "@/controllers/admin/dashboard.controller";
import { deleteCoordinator } from "@/controllers/admin/delete.coordinator.controller";
import { getCoordinatorById } from "@/controllers/admin/get-unique.coordinators.controller";
import { getCoordinators } from "@/controllers/admin/get.coordinators.controller";
import { getSettings, updateSettings } from "@/controllers/admin/settings.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { Router } from "express";

const adminRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin endpoints for managing coordinators
 */

/**
 * @swagger
 * /api/admin/coordinator:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a new coordinator
 *     description: Create a new coordinator with user account and coordinator details. Profile picture can be uploaded as multipart/form-data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: "#/components/schemas/CreateCoordinatorRequest"
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateCoordinatorRequest"
 *     responses:
 *       201:
 *         description: Coordinator created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CoordinatorResponse"
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       409:
 *         description: Conflict - User with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
adminRoutes.post("/coordinator", authenticate, authorize("admin"), upload(['image/jpeg', 'image/png', 'image/jpg']), createCoordinator);

/**
 * @swagger
 * /api/admin/coordinator:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all coordinators
 *     description: Get all coordinators with their user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coordinators fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CoordinatorsListResponse"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
adminRoutes.get("/coordinator", authenticate, authorize("admin"), getCoordinators);

/**
 * @swagger
 * /api/admin/coordinator/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get a coordinator by id
 *     description: Get a coordinator by id with user information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coordinator details ID
 *         example: "clx123abc456def789"
 *     responses:
 *       200:
 *         description: Coordinator fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CoordinatorResponse"
 *       400:
 *         description: Bad request - Invalid coordinator ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Coordinator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
adminRoutes.get("/coordinator/:id", authenticate, authorize("admin"), getCoordinatorById);

/**
 * @swagger
 * /api/admin/coordinator/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete a coordinator by id
 *     description: Delete a coordinator and their associated user account. The user will be deleted automatically due to cascade delete.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coordinator details ID
 *         example: "clx123abc456def789"
 *     responses:
 *       200:
 *         description: Coordinator deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SuccessResponse"
 *       400:
 *         description: Bad request - Invalid coordinator ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Coordinator not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
adminRoutes.delete("/coordinator/:id", authenticate, authorize("admin"), deleteCoordinator);
/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get settings
 *     description: Get settings
 */
adminRoutes.get("/settings", authenticate, getSettings);
/**
 * @swagger
 * /api/admin/settings:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update settings
 *     description: Update settings
 */
adminRoutes.patch("/settings", authenticate, authorize("admin"), updateSettings);
adminRoutes.patch("/coordinator/:coordinatorId", authenticate, authorize("admin"), toggleCoordinatorStatus);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *    tags:
 *     - Admin
 *    summary: get admin dashboard details
 *    description: admin dashboard creds
 */
adminRoutes.get("/dashboard", authenticate, authorize("admin"), dashboardlogic)
export default adminRoutes;