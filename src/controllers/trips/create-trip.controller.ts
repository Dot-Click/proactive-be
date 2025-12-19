import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { fetchCorrd } from "@/utils/geocoding.util";
import { database } from "@/configs/connection.config";
import { trips, discounts, tripCoordinators } from "@/schema/schema";
import { createId } from "@paralleldrive/cuid2";
import { ZodError } from "zod";
import { createTripSchema } from "@/types/trip.types";
import { eq } from "drizzle-orm";

// Type augmentation for file uploads with multer
declare global {
  namespace Express {
    interface Request {
      files?: {
        promotional_video?: Array<{ path: string }>;
        cover_img?: Array<{ path: string }>;
        tt_img?: Array<{ path: string }>;
        gallery_images?: Array<{ path: string }>;
        image?: Array<{ path: string }>;
        logo?: Array<{ path: string }>;
        prof_pic?: Array<{ path: string }>;
        file4?: Array<{ path: string }>;
      };
    }
  }
}

/**
 * @swagger
 * /api/trips:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Create a new trip
 *     description: Create a new trip with coordinators, images, and videos (Coordinator/Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               cover_img:
 *                 type: string
 *                 format: binary
 *               tt_img:
 *                 type: string
 *                 format: binary
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const createTrip = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const { id } = req.user as any;
    const { ...payload }: any = req.body;


    let coordinatorIds: string[] = [];
    if (payload.coordinators) {
      if (typeof payload.coordinators === "string") {
        try {
          coordinatorIds = JSON.parse(payload.coordinators);
        } catch (error) {
          coordinatorIds = (payload.coordinators as string)
            .split(",")
            .map((id: string) => id.trim());
        }
      } else if (Array.isArray(payload.coordinators)) {
        coordinatorIds = payload.coordinators;
      }
    }

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

    const map_coord = await fetchCorrd(payload.location);
    payload.mapCoordinates = `${map_coord.lat},${map_coord.lon}`;


    const validCoordinatorIds = coordinatorIds.filter(
      (cid: string) => cid && typeof cid === "string" && cid.trim() !== ""
    );
    const coordinatorIdsList = [
      ...(id && typeof id === "string" ? [id] : []),
      ...validCoordinatorIds,
    ].filter((cid, index, self) => cid && self.indexOf(cid) === index);
    
    
    const validationResult = createTripSchema.safeParse(payload);
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

    const validatedPayload = validationResult.data;
    const { coordinators, discounts: tripDiscounts, ...tripData } = validatedPayload;

    const db = await database();

    // Create trip - map validated data to database schema
    const tripValues: any = {
      title: validatedPayload.title,
      description: validatedPayload.description,
      coverImage: validatedPayload.coverImage || "",
      type: validatedPayload.type,
      location: validatedPayload.location,
      mapCoordinates: validatedPayload.mapCoordinates,
      startDate: validatedPayload.startDate,
      endDate: validatedPayload.endDate,
      duration: validatedPayload.duration,
      longDesc: validatedPayload.longDesc || "",
      groupSize: validatedPayload.groupSize || "",
      rhythm: validatedPayload.rhythm,
      sportLvl: validatedPayload.sportLvl || "",
      weekendTt: validatedPayload.weekendTt || "",
      included: validatedPayload.included || null,
      notIncluded: validatedPayload.notIncluded || null,
      shortDesc: validatedPayload.shortDesc || "",
      instaLink: validatedPayload.instaLink || null,
      likedinLink: validatedPayload.likedinLink || null,
      promotionalVideo: validatedPayload.promotionalVideo || "",
      galleryImages: validatedPayload.galleryImages || [],
      bestPriceMsg: validatedPayload.bestPriceMsg || "",
      perHeadPrice: validatedPayload.perHeadPrice || "",
      status: validatedPayload.status || "pending",
    };

    const newTrip = await db
      .insert(trips)
      .values(tripValues)
      .returning();

    const trip = newTrip[0];

    // Create discounts if provided
    if (tripDiscounts && Array.isArray(tripDiscounts) && tripDiscounts.length > 0) {
      const discountValues = tripDiscounts.map((discount: any) => ({
        id: createId(),
        tripId: trip.id,
        discountCode: discount.discountCode,
        discountPercentage: discount.discountPercentage,
        amount: discount.amount,
        validTill: new Date(discount.validTill),
        description: discount.description,
        status: discount.status || "active",
        maxUsage: discount.maxUsage || "0",
      }));

      await db.insert(discounts).values(discountValues);
    }

    // Handle coordinators relationship - create entries in junction table
    if (coordinatorIdsList.length > 0) {
      const coordinatorValues = coordinatorIdsList
        .filter((coordId: string) => coordId && typeof coordId === "string" && coordId.trim() !== "")
        .map((coordId: string) => {
          const trimmedId = coordId.trim();
          if (!trimmedId) {
            return null;
          }
          return {
            id: createId(),
            tripId: trip.id,
            userId: trimmedId,
          };
        })
        .filter((val) => val !== null) as Array<{ id: string; tripId: string; userId: string }>;
      
      if (coordinatorValues.length > 0) {
        await db.insert(tripCoordinators).values(coordinatorValues);
      }
    }

    return sendSuccess(
      res,
      "Trip created successfully",
      { trip },
      status.CREATED
    );
  } catch (error: any) {
    console.error("Create trip error:", error);

    // Handle validation errors
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
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
      console.log(error);
    }

    if (error.errors) {
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        error.errors
      );
    }

    return sendError(
      res,
      error.message || "An error occurred while creating trip",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
