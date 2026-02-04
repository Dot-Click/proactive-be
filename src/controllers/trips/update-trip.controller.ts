import { database } from "@/configs/connection.config";
import { trips, discounts, locations, categories } from "@/schema/schema";
import { fetchCorrd } from "@/utils/geocoding.util";
import { updateTripSchema } from "@/types/trip.types";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";
import { createNotification } from "@/services/notifications.services";

/**
 * @swagger
 * /api/trip/{id}:
 *   patch:
 *     tags:
 *       - Trips
 *     summary: Update a trip by ID
 *     description: Update a trip by ID
 */
export const updateTrip = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

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
            payload.daysItinerary[dayIndex] = {
              day: dayIndex + 1,
              description: "",
              image: imageUrl,
            };
          }
        });
      }
    }
    const validationResult = updateTripSchema.safeParse(payload);
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
      discounts: tripDiscounts,
      daysItinerary,
      ...tripData
    } = validatedPayload;

    // Map daysItinerary to daysItenary (database column name)
    if (daysItinerary !== undefined) {
      (tripData as any).daysItenary = daysItinerary;
    }

    const db = await database();

    if (tripData.locationId) {
      const locationRow = await db
        .select({ name: locations.name })
        .from(locations)
        .where(eq(locations.id, tripData.locationId))
        .limit(1);
      if (locationRow.length === 0) {
        return sendError(res, "Invalid location ID", status.BAD_REQUEST);
      }
      const map_coord = await fetchCorrd(locationRow[0].name);
      (tripData as any).mapCoordinates = `${map_coord.lat},${map_coord.lon}`;
    }

    if (tripData.categoryId) {
      const categoryRow = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, tripData.categoryId))
        .limit(1);
      if (categoryRow.length === 0) {
        return sendError(res, "Invalid category ID", status.BAD_REQUEST);
      }
    }

    // Update trip (excluding discounts from trip update)
    const trip = await db
      .update(trips)
      .set(tripData as any)
      .where(eq(trips.id, id))
      .returning();

    if (trip.length === 0) {
      return sendError(res, "Trip not found", status.NOT_FOUND);
    }

    // Handle discounts update - add new discounts to existing ones if provided
    if (
      tripDiscounts !== undefined &&
      Array.isArray(tripDiscounts) &&
      tripDiscounts.length > 0
    ) {
      try {
        const discountValues = tripDiscounts.map((discount: any) => {
          return {
            id: createId(),
            tripId: id,
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
        console.error("Error adding discounts:", discountError);
        console.error("Discount data:", JSON.stringify(tripDiscounts, null, 2));
      }
    } else if (
      tripDiscounts !== undefined &&
      Array.isArray(tripDiscounts) &&
      tripDiscounts.length === 0
    ) {
      console.log(
        `Empty discounts array provided for trip ${id} - no discounts added, existing discounts preserved`
      );
    } else {
      console.log(
        `Discounts field not provided in update for trip ${id} - keeping existing discounts`
      );
    }

    await createNotification({
      userId,
      title: "Trip updated",
      description: "Trip updated successfully",
      type: "trip",
    });

    return sendSuccess(
      res,
      "Trip updated successfully",
      { trip: trip[0] },
      status.OK
    );
  } catch (error) {
    console.error("Update trip error:", error);
    return sendError(
      res,
      "An error occurred while updating trip",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
