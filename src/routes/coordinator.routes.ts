import { getAllApplications, getApplicationById } from "@/controllers/coordinators/get.all.applications";
import { getAllAchievements } from "@/controllers/coordinators/get.all.acheivemnets";
import { updateApplication } from "@/controllers/coordinators/update.application.controller";
import { updateCoordinator } from "@/controllers/coordinators/update..controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { Router } from "express";
import { dashboardlogic } from "@/controllers/coordinators/dashboard.controller";
import { settings, updateSettings } from "@/controllers/coordinators/settings.controller";
import { singleUpload, upload } from "@/middlewares/multer.middleware";
import { searchAchievements } from "@/controllers/achievements/search-achievements.controller";

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

/**
 * @swagger
 * /api/coordinator/application/:id:
 *   get:
 *    tags:
 *     - Coordinator
 *    summary: get application by id
 *    description: get application by id
 */
coordinatorRoutes.get("/application/:id", authenticate, authorize("coordinator", "admin"), getApplicationById);

/**
 * @swagger
 * /api/coordinator/application/:id:
 *   patch:
 *    tags:
 *     - Coordinator
 *    summary: update application by id
 *    description: update application by id
 */
coordinatorRoutes.patch("/applications/:applicationId", authenticate, authorize("coordinator","admin"), updateApplication);


/**
 * @swagger
 * /api/achievements/search:
 *   get:
 *     tags:
 *       - Achievements
 *     summary: Search achievements by user name or trip title
 *     description: Search for achievements using user name or trip title. Returns matching achievements with user and trip details.
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for user name or trip title
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Internal server error
 */
coordinatorRoutes.get("/achievements/search", authenticate, searchAchievements);

/**
 * @swagger
 * /api/coordinator/achievements:
 *   get:
 *    tags:
 *     - Coordinator
 *    summary: get all achievements
 *    description: get all achievements
 */
coordinatorRoutes.get("/achievements", authenticate, authorize("coordinator","admin"), getAllAchievements);
/**
 * @swagger
 * /api/coordinator/setting:
 *   get:
 *    tags:
 *     - Coordinator
 *    summary: get coordinator current settings
 *    description: get coordinator current settings
 */
coordinatorRoutes.get("/setting", authenticate,  settings)



/**
 * @swagger
 * /api/coordinator/updateSettings/:cid:
 *   patch:
 *    tags:
 *     - Coordinator
 *    summary: update coordinator fields
 *    description: update coordinator fields accessable for both admin and coordinator
 *    parameters:
 *     - in: path
 *       name: cid
 *       required: true
 *       description: Coordinator ID
 *       schema:
 *         type: string
 *    requestBody:
 *     required: true
 *     content:
 *      multipart/form-data:
 *       schema:
 *        type: object
 *        properties:
 *         fullName:
 *          type: string
 *         phoneNumber:
 *          type: string
 *         bio:
 *          type: string
 *         prof_pic:
 *          type: binary
 *         specialities:
 *          type: array
 *          items:
 *           type: string
 *         languages:
 *          type: array
 *          items:
 *           type: string
 *         certificateLvl:
 *          type: string
 *         yearsOfExperience:
 *          type: number
 *         location:
 *          type: string
 *         type:
 *          type: string
 *         accessLvl:
 *          type: string
 *         notificationPref:
 *          type: object
 *          properties:
 *           emailNotf:
 *            type: boolean
 *           appAlert:
 *            type: boolean
 *           reviewNotf:
 *            type: boolean
 *       responses:
 *        200:
 *         description: Success
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *            properties:
 *             message:
 *              type: string
 */
coordinatorRoutes.patch("/updateSettings/:cid", authenticate, authorize("coordinator","admin"),singleUpload("prof_pic"), updateCoordinator);

/**
 * @swagger
 * /api/coordinator/setting:
 *   patch:
 *    tags:
 *     - Coordinator
 *    summary: update coordinator settings
 *    description: update coordinator settings accessable for coordinator
 *    
 */
coordinatorRoutes.patch("/setting", authenticate, authorize("coordinator"), singleUpload("prof_pic"), updateSettings)
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