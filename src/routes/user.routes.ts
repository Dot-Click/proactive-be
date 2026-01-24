import { submitApplication } from "@/controllers/user/applications.submit.controller";
import {
  getInstaInfo,
  getReviews,
} from "@/controllers/user/insta&reviews.controller";
import { getUserAchievementsController } from "@/controllers/user/get.achievements.controller";
import { dashboard } from "@/controllers/user/dashboard.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { Request, Response, Router } from "express";
import { sendSMS } from "@/utils/brevo.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import status from "http-status";
import {
  deleteAuthUser,
  getuserSettings,
} from "@/controllers/user/settings.controller";
import { getAllUsers } from "@/controllers/user/get-all-users.controller";
import { getUserByID } from "@/controllers/user/get-user-by-id.controller";
import { updateUserStatus } from "@/controllers/user/update-status.controller";

const userRoutes = Router();

/**
 * @swagger
 * /api/user/get-all-users:
 *   get:
 *     tags:
 *       - User
 *     summary: Get all users
 *     description: Get all users with their details including coordinator information (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
userRoutes.get("/get-all-users", authenticate, authorize("admin"), getAllUsers);


/**
 * @swagger
 * /api/user/dasboard:
 *   get:
 *     tags:
 *       - User
 *     summary: User dashboard records
 *     description: User dashboard records
 *     security:
 *       - bearerAuth: []
 */
userRoutes.get(
  "/dashboard",
  authenticate,
  authorize("user", "admin"),
  dashboard,
);
userRoutes.get("/insta-info", getInstaInfo);
userRoutes.get("/reviews", getReviews);

/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     tags:
 *       - User
 *     summary: get user current settings
 *     description: get user current settings
 *     security:
 *       - bearerAuth: []
 */
userRoutes.get("/settings", authenticate, authorize("user"), getuserSettings);

/**
 * @swagger
 * /api/user/{userId}/status:
 *   patch:
 *     tags:
 *       - User
 *     summary: Update user status
 *     description: Update the status of a specific user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New status for the user
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Bad request - Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoutes.patch("/:userId/status", authenticate, authorize("admin"), updateUserStatus);
/**
 * @swagger
 * /api/user/deleteMe:
 *   delete:
 *     tags:
 *       - User
 *     summary: delete current auth user
 *     description: delete current auth user
 *     security:
 *       - bearerAuth: []
 */
userRoutes.delete("/deleteMe", authenticate, authorize("user"), deleteAuthUser);
userRoutes.post(
  "/applications",
  authenticate,
  authorize("user", "admin"),
  upload(["video/mp4", "video/mov"]),
  submitApplication,
);
userRoutes.get(
  "/achievements",
  authenticate,
  authorize("user", "admin"),
  getUserAchievementsController,
);

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user by ID
 *     description: Get specific user data with coordinator details if applicable (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       400:
 *         description: Bad request - Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoutes.get("/:userId", authenticate, authorize("admin"), getUserByID);

export default userRoutes;
