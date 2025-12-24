import { getAllApplications } from "@/controllers/coordinators/get.all.applications";
import { getAllAchievements } from "@/controllers/coordinators/get.all.acheivemnets";
import { updateApplication } from "@/controllers/coordinators/update.application.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { Router } from "express";

const coordinatorRoutes = Router();

coordinatorRoutes.get("/applications", authenticate, authorize("coordinator","admin"), getAllApplications);
coordinatorRoutes.patch("/applications/:applicationId", authenticate, authorize("coordinator","admin"), updateApplication);
coordinatorRoutes.get("/achievements", authenticate, authorize("coordinator","admin"), getAllAchievements);

export default coordinatorRoutes;