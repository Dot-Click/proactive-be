import { database } from "@/configs/connection.config";
import { applications } from "@/schema/schema";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import { createId } from "@paralleldrive/cuid2";
import { Request, Response } from "express";
import status from "http-status";
import { createApplicationSchema } from "@/types/user.types";
import { and, eq } from "drizzle-orm";
// Import auth middleware to get Request type extension
import "@/middlewares/auth.middleware";

export const submitApplication = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { ...payload }: any = req.body;

    const userId = req.user!.userId;
    const db = await database();

    // Check if application already exists for this trip and user
    if (payload.tripId) {
      const existingApplication = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.tripId, payload.tripId),
            eq(applications.userId, userId)
          )
        )
        .limit(1);

      if (existingApplication.length > 0) {
        return sendError(
          res,
          "You have already applied for this trip",
          status.BAD_REQUEST
        );
      }
    }

    if (req.files) {
      if ((req.files as any).introVideo && (req.files as any).introVideo[0]) {
        const video = (await cloudinaryUploader(
          (req.files as any).introVideo[0].path
        )) as any;
        payload.introVideo = video.secure_url;
      }
    }
    const validationResult = createApplicationSchema.safeParse(payload);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((err) => {
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
    const [application] = await db
      .insert(applications)
      .values({
        id: createId(),
        userId,
        ...validationResult.data,
      })
      .returning();

    return sendSuccess(
      res,
      "Application submitted successfully",
      { application },
      status.CREATED
    );
  } catch (error) {
    return sendError(
      res,
      "Failed to submit application",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
