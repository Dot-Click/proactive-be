import { Router } from "express";
import { createTrip } from "@/controllers/trips/create-trip.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { getTrips } from "@/controllers/trips/get-trips.controller";
import { getTripById } from "@/controllers/trips/get-unique-tripe.controller";
import { updateTrip } from "@/controllers/trips/update-trip.controller";

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

/**
 * @swagger
 * /api/trip:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get all trips
 *     description: Get all trips
 */
tripRoutes.get("/", authenticate, getTrips);

/**
 * @swagger
 * /api/trip/{id}:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get a trip by ID
 *     description: Get a trip by ID
 */
tripRoutes.get("/:id", authenticate, authorize("admin", "coordinator", "user"), getTripById);

/**
 * @swagger
 * /api/trip/{id}:
 *   patch:
 *     tags:
 *       - Trips
 *     summary: Update a trip by ID
 *     description: Update a trip by ID
 */
tripRoutes.patch("/:id", authenticate, authorize("admin", "coordinator"),upload(['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/mov']), updateTrip);
export default tripRoutes;