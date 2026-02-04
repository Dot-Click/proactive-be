import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { fetchCorrd } from "@/utils/geocoding.util";
import { database } from "@/configs/connection.config";
import {
  trips,
  discounts,
  tripCoordinators,
  users,
  locations,
  categories,
} from "@/schema/schema";
import { createId } from "@paralleldrive/cuid2";
import { ZodError } from "zod";
import { createTripSchema } from "@/types/trip.types";
import { eq, inArray } from "drizzle-orm";
import { createNotification } from "@/services/notifications.services";

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
        day_images?: Array<{ path: string }>;
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

    // Parse the payload from FormData - frontend sends JSON string in 'payload' field
    let payload: any = {};
    if (req.body.payload) {
      try {
        payload =
          typeof req.body.payload === "string"
            ? JSON.parse(req.body.payload)
            : req.body.payload;
      } catch (e) {
        console.error("Error parsing payload:", e);
        payload = req.body;
      }
    } else {
      // Fallback to direct body if no payload field
      payload = { ...req.body };
    }

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
      if (
        (req.files as any).promotional_video &&
        (req.files as any).promotional_video[0]
      ) {
        const video = (await cloudinaryUploader(
          (req.files as any).promotional_video[0].path
        )) as any;
        payload.promotionalVideo = video.secure_url;
      }

      if (
        (req.files as any).gallery_images &&
        Array.isArray((req.files as any).gallery_images) &&
        (req.files as any).gallery_images.length > 0
      ) {
        const galleryPaths = (req.files as any).gallery_images.map(
          (file: any) => file.path
        );
        const gallery_images = (await cloudinaryUploader(galleryPaths)) as any;
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

      // Handle day images upload
      if (
        (req.files as any).day_images &&
        Array.isArray((req.files as any).day_images) &&
        (req.files as any).day_images.length > 0
      ) {
        // Parse day_image_indices if provided (to map images to correct days)
        let dayImageIndices: number[] = [];
        if (payload.day_image_indices) {
          if (typeof payload.day_image_indices === "string") {
            // Single index as string
            dayImageIndices = [parseInt(payload.day_image_indices)];
          } else if (Array.isArray(payload.day_image_indices)) {
            dayImageIndices = payload.day_image_indices.map((idx: string) =>
              parseInt(idx)
            );
          }
        }

        // Upload day images to cloudinary
        const dayImagePaths = (req.files as any).day_images.map(
          (file: any) => file.path
        );
        const uploadedDayImages = (await cloudinaryUploader(
          dayImagePaths
        )) as any;
        const dayImageUrls = Array.isArray(uploadedDayImages)
          ? uploadedDayImages.map((img: any) => img.secure_url)
          : [uploadedDayImages.secure_url];

        // Initialize daysItinerary if not present
        if (!payload.daysItinerary) {
          payload.daysItinerary = [];
        }
        if (typeof payload.daysItinerary === "string") {
          try {
            payload.daysItinerary = JSON.parse(payload.daysItinerary);
          } catch {
            payload.daysItinerary = [];
          }
        }

        // Map uploaded images to their corresponding days
        dayImageUrls.forEach((imageUrl: string, i: number) => {
          const dayIndex = dayImageIndices.length > i ? dayImageIndices[i] : i;
          if (payload.daysItinerary[dayIndex]) {
            payload.daysItinerary[dayIndex].image = imageUrl;
          } else {
            // Create the day entry if it doesn't exist
            payload.daysItinerary[dayIndex] = {
              day: dayIndex + 1,
              description: "",
              image: imageUrl,
            };
          }
        });
      }
    }

    const validCoordinatorIds = coordinatorIds.filter(
      (cid: string) => cid && typeof cid === "string" && cid.trim() !== ""
    );
    const coordinatorIdsList = [
      ...(id && typeof id === "string" ? [id] : []),
      ...validCoordinatorIds,
    ].filter((cid, index, self) => cid && self.indexOf(cid) === index);

    // Normalize date fields that come from multipart/form-data as strings
    if (payload.startDate && typeof payload.startDate === "string") {
      const s = payload.startDate.trim();
      if (s) {
        const d = new Date(s);
        payload.startDate = isNaN(d.getTime()) ? payload.startDate : d;
      } else {
        payload.startDate = undefined;
      }
    }

    if (payload.endDate && typeof payload.endDate === "string") {
      const s = payload.endDate.trim();
      if (s) {
        const d = new Date(s);
        payload.endDate = isNaN(d.getTime()) ? payload.endDate : d;
      } else {
        payload.endDate = undefined;
      }
    }

    const validationResult = createTripSchema.safeParse(payload);
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

    const validatedPayload = validationResult.data;
    const {
      coordinators,
      discounts: tripDiscounts,
      ...tripData
    } = validatedPayload;

    const db = await database();

    const locationRow = await db
      .select({ name: locations.name })
      .from(locations)
      .where(eq(locations.id, validatedPayload.locationId))
      .limit(1);
    if (locationRow.length === 0) {
      return sendError(res, "Invalid location ID", status.BAD_REQUEST);
    }

    const categoryRow = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, validatedPayload.categoryId))
      .limit(1);
    if (categoryRow.length === 0) {
      return sendError(res, "Invalid category ID", status.BAD_REQUEST);
    }

    const map_coord = await fetchCorrd(locationRow[0].name);
    const mapCoordinates = `${map_coord.lat},${map_coord.lon}`;

    // Create trip - map validated data to database schema
    const tripValues: any = {
      title: validatedPayload.title,
      description: validatedPayload.description,
      coverImage: validatedPayload.coverImage || "",
      categoryId: validatedPayload.categoryId,
      locationId: validatedPayload.locationId,
      mapCoordinates,
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
      // Store days itinerary data (using existing daysItenary column in DB)
      daysItenary: validatedPayload.daysItinerary || [],
    };

    const newTrip = await db.insert(trips).values(tripValues).returning();

    const trip = newTrip[0];

    // Create discounts if provided
    if (
      tripDiscounts &&
      Array.isArray(tripDiscounts) &&
      tripDiscounts.length > 0
    ) {
      try {
        const discountValues = tripDiscounts.map((discount: any) => {
          // Map from schema field names (snake_case) to database model fields (camelCase)
          return {
            id: createId(),
            tripId: trip.id,
            discountCode: discount.discount_code, // schema uses discount_code
            discountPercentage: discount.discount_percentage, // schema uses discount_percentage
            amount: discount.amount?.toString() || "0",
            validTill:
              discount.valid_till instanceof Date
                ? discount.valid_till
                : new Date(discount.valid_till), // schema uses valid_till
            description: discount.description,
            status: (discount.status as any) || "active",
            maxUsage:
              discount.maxUsage?.toString() ||
              discount.max_usage?.toString() ||
              "0",
          };
        });

        await db.insert(discounts).values(discountValues);
      } catch (discountError: any) {
        console.error("Error creating discounts:", discountError);
        console.error("Discount data:", JSON.stringify(tripDiscounts, null, 2));
      }
    } else {
      console.log(
        `No discounts provided for trip ${
          trip.id
        } (tripDiscounts: ${JSON.stringify(tripDiscounts)})`
      );
    }

    // Handle coordinators relationship - create entries in junction table
    if (coordinatorIdsList.length > 0) {
      const validCoordinatorIds = coordinatorIdsList.filter(
        (coordId: string) =>
          coordId && typeof coordId === "string" && coordId.trim() !== ""
      );

      // Validate that all coordinator user IDs exist in the users table
      if (validCoordinatorIds.length > 0) {
        const existingUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.id, validCoordinatorIds));

        const existingUserIds = new Set(existingUsers.map((u) => u.id));
        const invalidIds = validCoordinatorIds.filter(
          (id) => !existingUserIds.has(id)
        );

        if (invalidIds.length > 0) {
          return sendError(
            res,
            `Invalid coordinator user IDs: ${invalidIds.join(
              ", "
            )}. These users do not exist.`,
            status.BAD_REQUEST
          );
        }

        const coordinatorValues = validCoordinatorIds
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
          .filter((val) => val !== null) as Array<{
          id: string;
          tripId: string;
          userId: string;
        }>;

        if (coordinatorValues.length > 0) {
          await db.insert(tripCoordinators).values(coordinatorValues);
        }
      }
    }
    if (typeof id === "string" && id.trim()) {
      try {
        await createNotification({
          userId: id.trim(),
          title: "Trip created",
          description: "Trip created successfully",
          type: "trip",
        });
        console.log("Notification sent to user:", id);
      } catch (notificationError: any) {
        console.error(
          "Notification failed (trip still created):",
          notificationError.message
        );
      }
    } else {
      console.warn("No valid user ID for notification:", id);
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
      error.issues.forEach((err) => {
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
