import { database } from "@/configs/connection.config";
import { applications } from "@/schema/schema";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import { createId } from "@paralleldrive/cuid2";
import { Request, Response } from "express";
import status from "http-status";
import { createApplicationSchema } from "@/types/user.types";
// Import auth middleware to get Request type extension
import "@/middlewares/auth.middleware";

/**
 * @swagger
 * /api/user/applications:
 *   post:
 *     tags:
 *       - User
 *       - Applications
 *     summary: Submit an application for a trip
 *     description: Submit an application for a trip. Video can be uploaded as a file (mp4/mov) or provided as a URL. Requires user or admin authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - tripId
 *               - shortIntro
 *             properties:
 *               tripId:
 *                 type: string
 *                 example: "clx123abc456def789"
 *                 description: "Trip ID to apply for"
 *               shortIntro:
 *                 type: string
 *                 example: "I am a 20 year old male from the United States."
 *                 description: "Short introduction about yourself"
 *               introVideo:
 *                 type: string
 *                 format: binary
 *                 description: "Introduction video file (mp4 or mov)"
 *               dietaryRestrictions:
 *                 type: string
 *                 example: "I am a vegetarian."
 *                 description: "Dietary restrictions or preferences (optional)"
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateApplicationRequest"
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApplicationResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - User role required
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
export const submitApplication = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {  ...payload }: any = req.body;
    
    const userId = req.user!.userId;
    const db = await database();
    if (req.files) {

        if ((req.files as any).introVideo && (req.files as any).introVideo[0]) {
          const video = await cloudinaryUploader(
            (req.files as any).introVideo[0].path
          ) as any;
          payload.introVideo = video.secure_url;
        }
    }
    const validationResult = createApplicationSchema.safeParse(payload);
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
    return sendError(res, "Failed to submit application", status.INTERNAL_SERVER_ERROR);
  }
}