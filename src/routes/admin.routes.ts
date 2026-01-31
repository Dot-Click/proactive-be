import { toggleCoordinatorStatus } from "@/controllers/admin/block.coordinator.controller";
import { createCoordinator } from "@/controllers/admin/create.coordinator.controller";
import { dashboardlogic } from "@/controllers/admin/dashboard.controller";
import { deleteCoordinator } from "@/controllers/admin/delete.coordinator.controller";
import { getCoordinatorById } from "@/controllers/admin/get-unique.coordinators.controller";
import { getCoordinators } from "@/controllers/admin/get.coordinators.controller";
import { sendMails } from "@/controllers/admin/send.emails.controller";
import { getSettings, updateSettings } from "@/controllers/admin/settings.controller";
import { createLocation } from "@/controllers/location/create-location.controller";
import { getLocations } from "@/controllers/location/get-locations.controller";
import { getLocation } from "@/controllers/location/get-location.controller";
import { updateLocation } from "@/controllers/location/update-location.controller";
import { deleteLocation } from "@/controllers/location/delete-location.controller";
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
adminRoutes.get("/coordinator", getCoordinators);

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
adminRoutes.get("/coordinator/:id", getCoordinatorById);

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

/**
 * @swagger
 * /api/admin/sendMail:
 *   post:
 *    tags:
 *     - Admin
 *    summary: sendmail to user and coordinators
 *    description: sendmail to user and coordinators
 */

adminRoutes.post("/sendMail", authenticate, authorize("admin"), sendMails);

/**
 * @swagger
 * /api/admin/location:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all locations
 *     description: Retrieve all locations. Used by admin and coordinators (e.g. for trip form location dropdown).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Locations retrieved successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     locations:
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/Location"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
adminRoutes.get("/location", authenticate, authorize("admin", "coordinator"), getLocations);

/**
 * @swagger
 * /api/admin/location/{locationId}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get a location by ID
 *     description: Retrieve a single location by ID (Admin or Coordinator).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID (e.g. CUID)
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       $ref: "#/components/schemas/Location"
 *       400:
 *         description: Bad request - Location ID required
 *       404:
 *         description: Location not found
 */
adminRoutes.get("/location/:locationId", authenticate, authorize("admin", "coordinator"), getLocation);

/**
 * @swagger
 * /api/admin/location:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a new location
 *     description: Create a new location (Admin only). Location names must be unique.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateLocationRequest"
 *     responses:
 *       201:
 *         description: Location created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     location:
 *                       $ref: "#/components/schemas/Location"
 *       400:
 *         description: Validation error
 *       409:
 *         description: A location with this name already exists
 */
adminRoutes.post("/location", authenticate, authorize("admin"), createLocation);

/**
 * @swagger
 * /api/admin/location/{locationId}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update a location
 *     description: Update an existing location name (Admin only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateLocationRequest"
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Location not found
 *       409:
 *         description: A location with this name already exists
 */
adminRoutes.put("/location/:locationId", authenticate, authorize("admin"), updateLocation);

/**
 * @swagger
 * /api/admin/location/{locationId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete a location
 *     description: Delete a location (Admin only). Fails if any trip references this location.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: locationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *       400:
 *         description: Cannot delete - one or more trips use this location
 *       404:
 *         description: Location not found
 */
adminRoutes.delete("/location/:locationId", authenticate, authorize("admin"), deleteLocation);

export default adminRoutes;