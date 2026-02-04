import { database } from "@/configs/connection.config";
import { coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Response, Request } from "express";
import status from "http-status";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/coordinator/settings:
 *   get:
 *     tags:
 *       - Coordinator
 *     summary: Get coordinator settings
 *     description: Get coordinator settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       500:
 *         description: Internal server error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * */
export const settings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    const db = await database();
    const settings = await db
      .select({
        id: users.id,
        fullName: coordinatorDetails.fullName,
        email: users.email,
        avatar: coordinatorDetails.profilePicture,
        notificationPref: coordinatorDetails.notificationPref,
      })
      .from(users)
      .leftJoin(
        coordinatorDetails,
        eq(coordinatorDetails.id, users.coordinatorDetails)
      )
      .where(eq(users.id, userId!))
      .limit(1);

    if (settings.length === 0) {
      return sendError(res, "Settings not found", status.NOT_FOUND);
    }

    return sendSuccess(res, "info retrieved", settings[0], status.OK);
  } catch (error) {
    console.log(error);
    return sendError(res, "server error", status.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Update coordinator settings (name, email, profile picture)
 */
export const updateSettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    const db = await database();

    const { Name, Email } = req.body;

    // Handle profile picture upload if present
    let profilePictureUrl: string | undefined;
    if (req.file) {
      try {
        const prof_pic = (await cloudinaryUploader(
          (req.file as any).path
        )) as any;
        profilePictureUrl = prof_pic.secure_url as string;
      } catch (error) {
        console.error("Profile picture upload error:", error);
        return sendError(
          res,
          "Failed to upload profile picture",
          status.INTERNAL_SERVER_ERROR
        );
      }
    }

    // Get user and coordinator details
    const userData = await db
      .select({
        userId: users.id,
        coordinatorDetailsId: users.coordinatorDetails,
      })
      .from(users)
      .where(eq(users.id, userId!))
      .limit(1);

    if (userData.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    const coordinatorDetailsId = userData[0].coordinatorDetailsId;

    // Update user email if provided
    if (Email) {
      // Check if email already exists (excluding current user)
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, Email))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        return sendError(res, "Email already exists", status.CONFLICT);
      }

      await db.update(users).set({ email: Email }).where(eq(users.id, userId!));
    }

    // Check if coordinator details already exist for this user directly
    const existingCoordinator = await db
      .select({ id: coordinatorDetails.id })
      .from(coordinatorDetails)
      .where(eq(coordinatorDetails.userId, userId!))
      .limit(1);

    const targetCoordinatorId =
      coordinatorDetailsId || existingCoordinator[0]?.id;

    // Update coordinator details if exists, otherwise create new
    if (targetCoordinatorId) {
      const updateData: any = {};
      if (Name) updateData.fullName = Name;
      if (profilePictureUrl) updateData.profilePicture = profilePictureUrl;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(coordinatorDetails)
          .set(updateData)
          .where(eq(coordinatorDetails.id, targetCoordinatorId));
      }

      // Ensure linkage in users table if it was missing
      if (!coordinatorDetailsId) {
        await db
          .update(users)
          .set({ coordinatorDetails: targetCoordinatorId })
          .where(eq(users.id, userId!));
      }
    } else {
      // Create coordinator details if it doesn't exist
      const newCoordDetails = await db
        .insert(coordinatorDetails)
        .values({
          id: createId(),
          userId: userId!,
          fullName: Name || null,
          profilePicture: profilePictureUrl || null,
        })
        .returning({ id: coordinatorDetails.id });

      // Update user with coordinatorDetails reference
      await db
        .update(users)
        .set({ coordinatorDetails: newCoordDetails[0].id })
        .where(eq(users.id, userId!));
    }

    // Fetch updated settings
    const updatedSettings = await db
      .select({
        id: users.id,
        Name: coordinatorDetails.fullName,
        Email: users.email,
        avatar: coordinatorDetails.profilePicture,
      })
      .from(users)
      .leftJoin(
        coordinatorDetails,
        eq(coordinatorDetails.id, users.coordinatorDetails)
      )
      .where(eq(users.id, userId!))
      .limit(1);

    return sendSuccess(
      res,
      "Settings updated successfully",
      updatedSettings[0] || {},
      status.OK
    );
  } catch (error) {
    console.log("Update settings error:", error);
    return sendError(res, "server error", status.INTERNAL_SERVER_ERROR);
  }
};
