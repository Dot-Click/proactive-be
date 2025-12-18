import { Router } from "express";
import { createTrip } from "@/controllers/trips/create-trip.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";

const tripRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Trips
 *     description: Trip management endpoints
 */

/**
 * @swagger
 * /api/trip:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Create a new trip
 *     description: Create a new trip with coordinators, images, and videos (Coordinator/Admin only)
 *     security:
 *       - bearerAuth: []
 */
tripRoutes.post("/", authenticate, authorize("admin", "coordinator"), upload(['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/mov']), createTrip);

export default tripRoutes;