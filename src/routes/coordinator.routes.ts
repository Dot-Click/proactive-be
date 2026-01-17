import { getAllApplications } from "@/controllers/coordinators/get.all.applications";
import { getAllAchievements } from "@/controllers/coordinators/get.all.acheivemnets";
import { updateApplication } from "@/controllers/coordinators/update.application.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { dashboardlogic } from "@/controllers/coordinators/dashboard.controller";
import { settings } from "@/controllers/coordinators/settings.controller";

const coordinatorRoutes = Router();

coordinatorRoutes.get("/applications", authenticate, authorize("coordinator","admin"), getAllApplications);
coordinatorRoutes.patch("/applications/:applicationId", authenticate, authorize("coordinator","admin"), updateApplication);
coordinatorRoutes.get("/achievements", authenticate, authorize("coordinator","admin"), getAllAchievements);
coordinatorRoutes.get("/setting", authenticate, authorize("coordinator"), settings)
/**
 * @swagger
 * /api/coordinator/dashboard:
 *   get:
 *    tags:
 *     - Application
 *    summary: get admin dashboard details
 *    description: admin dashboard creds
 */
coordinatorRoutes.get("/dashboard", authenticate, authorize("coordinator"), dashboardlogic);

export default coordinatorRoutes;