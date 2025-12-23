import { getAllApplications } from "@/controllers/coordinators/get.all.applications";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { Router } from "express";

const coordinatorRoutes = Router();

coordinatorRoutes.get("/applications", authenticate, authorize("coordinator","admin"), getAllApplications);

export default coordinatorRoutes;