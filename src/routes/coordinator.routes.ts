import { getAllApplications } from "@/controllers/coordinators/get.all.applications";
import { getAllAchievements } from "@/controllers/coordinators/get.all.acheivemnets";
import { updateApplication } from "@/controllers/coordinators/update.application.controller";
import { updateCoordinator } from "@/controllers/coordinators/update..controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { dashboardlogic } from "@/controllers/coordinators/dashboard.controller";
import { settings, updateSettings } from "@/controllers/coordinators/settings.controller";
import { upload } from "@/middlewares/multer.middleware";

const coordinatorRoutes = Router();

/**
 * @swagger
 * /api/coordinator/applications:
 *   get:
 *    tags:
 *     - Coordinator
 *    summary: get coordinator applications
 *    description: get coordinator applications
 * 
 */
coordinatorRoutes.get("/applications", authenticate, authorize("coordinator","admin"), getAllApplications);
coordinatorRoutes.patch("/applications/:applicationId", authenticate, authorize("coordinator","admin"), updateApplication);
coordinatorRoutes.get("/achievements", authenticate, authorize("coordinator","admin", "user"), getAllAchievements);
/**
 * @swagger
 * /api/coordinator/setting:
 *   get:
 *    tags:
 *     - Coordinator
 *    summary: get coordinator current settings
 *    description: get coordinator current settings
 */
coordinatorRoutes.get("/setting", authenticate, authorize("coordinator"), settings)

/**
 * @swagger
 * /api/coordinator/updateSettings:
 *   patch:
 *    tags:
 *     - Coordinator
 *    summary: update coordinator settings
 *    description: update coordinator settings
 */
coordinatorRoutes.patch("/updateSettings", authenticate, authorize("coordinator"), updateCoordinator);

/**
 * @swagger
 * /api/coordinator/setting:
 *   patch:
 *    tags:
 *     - Coordinator
 *    summary: update coordinator settings
 *    description: update coordinator name, email, and profile picture
 */
coordinatorRoutes.patch("/setting", authenticate, authorize("coordinator"), upload(), updateSettings)
/**
 * @swagger
 * /api/coordinator/dashboard:
 *   get:
 *    tags:
 *     - Coordinator
 *    summary: get coordinator dashboard details
 *    description: coordinator dashboard creds
 */
coordinatorRoutes.get("/dashboard", authenticate, authorize("coordinator"), dashboardlogic);

export default coordinatorRoutes;