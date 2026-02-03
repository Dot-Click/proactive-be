import { Router } from "express";
import { createTrip } from "@/controllers/trips/create-trip.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { getTrips } from "@/controllers/trips/get-trips.controller";
import { getOpenTrips } from "@/controllers/trips/get-open-trips.controller";
import { getPastTrips } from "@/controllers/trips/get-past-trips.controller";
import { getTripById } from "@/controllers/trips/get-unique-tripe.controller";
import { updateTrip } from "@/controllers/trips/update-trip.controller";
import { approveTrip } from "@/controllers/trips/Approvetrip.controller";
import { rejectTrip } from "@/controllers/trips/rejectTrip.controller";
import { searchTrips } from "@/controllers/trips/search-trips.controller";

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
tripRoutes.post(
  "/",
  authenticate,
  authorize("admin", "coordinator"),
  upload([
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/gif",
    "video/mp4",
    "video/mov",
  ]),
  createTrip,
);

/**
 * @swagger
 * /api/trip:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get all trips
 *     description: Get all trips
 */
tripRoutes.get("/", getTrips);
// tripRoutes.get("/all", getTrips);

/** Public: open opportunities - no auth */
tripRoutes.get("/open", getOpenTrips);
/** Public: past adventures - no auth */
tripRoutes.get("/past", getPastTrips);
/** Public: trip detail by id (for view detail page without login) */
tripRoutes.get("/detail/:id", getTripById);

/**
 * @swagger
 * /api/trip/search:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Search trips by name or location
 *     description: Search for trips using trip name or location
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for trip name or location
 */
tripRoutes.get("/search", authenticate, searchTrips);

/**
 * @swagger
 * /api/trip/{id}:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get a trip by ID
 *     description: Get a trip by ID
 */
tripRoutes.get(
  "/:id",
  authenticate,
  authorize("admin", "coordinator", "user"),
  getTripById,
);

/**
 * @swagger
 * /api/trip/{id}:
 *   patch:
 *     tags:
 *       - Trips
 *     summary: Update a trip by ID
 *     description: Update a trip by ID
 */
tripRoutes.put(
  "/:id",
  authenticate,
  authorize("admin", "coordinator"),
  upload([
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/gif",
    "video/mp4",
    "video/mov",
  ]),
  updateTrip,
);

tripRoutes.patch(
  "/trips/:id/approve",
  authenticate,
  authorize("admin", "coordinator"),
  approveTrip,
);
tripRoutes.patch(
  "/trips/:id/reject",
  authenticate,
  authorize("admin", "coordinator"),
  rejectTrip,
);

export default tripRoutes;
