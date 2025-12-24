import { database } from "@/configs/connection.config";
import { applications, tripCoordinators, trips } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq, and } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";
import { z } from "zod";
import { trackTripAchievement } from "@/services/achievement.service";
import "@/middlewares/auth.middleware";
import { createNotification } from "@/services/notifications.services";

const updateApplicationSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
});

/**
 * @swagger
 * /api/coordinator/applications/{applicationId}:
 *   patch:
 *     tags:
 *       - Applications
 *     summary: Update application status
 *     description: Update the status of an application (pending, approved, rejected, cancelled). When status is set to "approved", achievements are automatically tracked based on trip type and user role. User receives a notification with the trip name when approved or rejected. Requires coordinator or admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID to update
 *         example: "clx123abc456def789"
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
 *                 enum: [pending, approved, rejected, cancelled]
 *                 example: approved
 *                 description: New status for the application
 *     responses:
 *       200:
 *         description: Application updated successfully
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
 *                   example: Application updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: "#/components/schemas/Application"
 *       400:
 *         description: Validation error - Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Coordinator or Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export const updateApplication = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { applicationId } = req.params;
    const validationResult = updateApplicationSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        errors
      );
    }

    const { status: newStatus } = validationResult.data;
    const db = await database();

    // Get the application
    const applicationResults = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (applicationResults.length === 0) {
      return sendError(res, "Application not found", status.NOT_FOUND);
    }

    const application = applicationResults[0];

    // Fetch trip details to get trip name
    const tripResults = await db
      .select({ title: trips.title })
      .from(trips)
      .where(eq(trips.id, application.tripId))
      .limit(1);

    const tripName = tripResults.length > 0 ? tripResults[0].title : "the trip";

    // Update application status
    const updatedApplication = await db
      .update(applications)
      .set({ status: newStatus as any })
      .where(eq(applications.id, applicationId))
      .returning();

    // If application is approved, track achievements
    if (newStatus === "approved") {
      try {
        // Check if user is a coordinator for this trip (leader role)
        const coordinatorCheck = await db
          .select()
          .from(tripCoordinators)
          .where(
            and(
              eq(tripCoordinators.tripId, application.tripId),
              eq(tripCoordinators.userId, application.userId)
            )
          )
          .limit(1);

        const role = coordinatorCheck.length > 0 ? "leader" : "participant";

        // Track achievement automatically
        await trackTripAchievement(
          application.userId,
          application.tripId,
          role
        );
        await createNotification({
          userId: application.userId,
          title: "Application approved",
          description: `Your application for "${tripName}" has been approved. You can now proceed with payment.`,
          type: "trip",
        });
      } catch (achievementError) {
        // Log error but don't fail the request
        console.error("Error tracking achievement:", achievementError);
      }
    }

    if (newStatus === "rejected") {
      try {
       
      await db.update(applications).set({ status: "rejected" }).where(eq(applications.id, applicationId));
      await createNotification({
        userId: application.userId,
        title: "Application rejected",
        description: `Your application for "${tripName}" has been rejected.`,
        type: "trip",
      });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
      }
    }
    return sendSuccess(
      res,
      "Application updated successfully",
      { application: updatedApplication[0] },
      status.OK
    );
  } catch (error) {
    console.error("Update application error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to update application",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

