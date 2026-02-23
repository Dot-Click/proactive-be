import { getAllNotificationsController } from "@/controllers/notifications/get.all.notifications";
import { markAsReadNotificationController } from "@/controllers/notifications/markAsRead.notification";
import { authenticate } from "@/middlewares/auth.middleware";
import { Router } from "express";

const notificationRoutes = Router();

/**
 * @swagger
 * /api/notification:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Get all notifications
 *     description: Get all notifications
 *     security:
 *       - bearerAuth: []
 */
notificationRoutes.get("/", authenticate, getAllNotificationsController);

/**
 * @swagger
 * /api/notification/{id}:
 *   patch:
 *     tags:
 *       - Notification
 *     summary: Update a notification
 *     description: Update a notification
 *     security:
 *       - bearerAuth: []
 */
import { markAllNotificationsAsReadController } from "@/controllers/notifications/markAllRead.notification";

// ...

notificationRoutes.patch("/mark-all-read", authenticate, markAllNotificationsAsReadController);
notificationRoutes.patch("/:id", authenticate, markAsReadNotificationController);

export default notificationRoutes;