import { database } from "@/configs/connection.config";
import { trips } from "@/schema/schema";
import { updateTripSchema } from "@/types/trip.types";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

/**
 * @swagger
 * /api/trip/{id}:
 *   patch:
 *     tags:
 *       - Trips
 *     summary: Update a trip by ID
 *     description: Update a trip by ID
 */
export const updateTrip = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { ...payload }: any = req.body;
    if (req.files) {

        if ((req.files as any).promotional_video && (req.files as any).promotional_video[0]) {
          const video = await cloudinaryUploader(
            (req.files as any).promotional_video[0].path
          ) as any;
          payload.promotionalVideo = video.secure_url;
        }
  
  
        if ((req.files as any).gallery_images && Array.isArray((req.files as any).gallery_images) && (req.files as any).gallery_images.length > 0) {
          const galleryPaths = (req.files as any).gallery_images.map(
            (file: any) => file.path
          );
          const gallery_images = (await cloudinaryUploader(
            galleryPaths
          )) as any;
          const gallery_images_urls = gallery_images.map(
            (image: any) => image.secure_url
          ) as string[];
          payload.galleryImages = gallery_images_urls;
        }
  
  
        if ((req.files as any).cover_img && (req.files as any).cover_img[0]) {
          const cover_image = (await cloudinaryUploader(
            (req.files as any).cover_img[0].path
          )) as any;
          payload.coverImage = cover_image.secure_url;
        }
  
  
        if ((req.files as any).tt_img && (req.files as any).tt_img[0]) {
          const weekend_tt = (await cloudinaryUploader(
            (req.files as any).tt_img[0].path
          )) as any;
          payload.weekendTt = weekend_tt.secure_url;
        }
      }
    const validationResult = updateTripSchema.safeParse(payload);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return sendError(res, "Validation failed", status.BAD_REQUEST, undefined, errors);
    }
    const db = await database();
    const trip = await db.update(trips).set(validationResult.data as any).where(eq(trips.id, id)).returning();
    return sendSuccess(res, "Trip updated successfully", { trip }, status.OK);
  } catch (error) {
    console.error("Update trip error:", error);
    return sendError(res, "An error occurred while updating trip", status.INTERNAL_SERVER_ERROR);
  }
};