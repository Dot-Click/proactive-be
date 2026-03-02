import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { database } from "@/configs/connection.config";
import { googleReviews } from "@/schema/schema";
import { eq, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import {
  cloudinaryUploader,
  cloudinaryDestroyByUrl,
} from "@/utils/cloudinary.util";

// validation schemas
const createReviewSchema = z.object({
  reviewerName: z.string().min(1),
  reviewText: z.string().min(1),
  stars: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((n) => !Number.isNaN(n) && n >= 0 && n <= 5),
  language: z.enum(["en", "es"]),
  reviewLink: z.string().url().optional().nullable(),
  isActive: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
});

const updateReviewSchema = createReviewSchema.partial();

/**
 * @swagger
 * /api/admin/google-reviews:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all google reviews (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reviews fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/Review"
 */
export const getAllGoogleReviews = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const db = await database();
    const rows = await db
      .select()
      .from(googleReviews)
      .orderBy(desc(googleReviews.createdAt));
    return sendSuccess(
      res,
      "Google reviews fetched successfully",
      { reviews: rows },
      status.OK
    );
  } catch (error) {
    console.error("Get all google reviews error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch reviews",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * @swagger
 * /api/admin/google-reviews:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a new google review
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - reviewerName
 *               - reviewText
 *               - stars
 *               - language
 *             properties:
 *               reviewerName:
 *                 type: string
 *               reviewText:
 *                 type: string
 *               stars:
 *                 type: integer
 *               language:
 *                 type: string
 *                 enum: [en, es]
 *               reviewLink:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error
 */
export const createGoogleReview = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const parsed = createReviewSchema.parse(req.body);
    const db = await database();

    let pictureUrl: string | null = null;
    const file =
      req.files &&
      (req.files as Record<string, Express.Multer.File[]>)?.profilePicture?.[0];
    if (file) {
      const result = (await cloudinaryUploader(file.path)) as { secure_url: string };
      pictureUrl = result.secure_url;
    }

    const [inserted] = await db
      .insert(googleReviews)
      .values({
        id: createId(),
        reviewerName: parsed.reviewerName,
        reviewText: parsed.reviewText,
        stars: parsed.stars,
        language: parsed.language,
        reviewLink: parsed.reviewLink || null,
        isActive: parsed.isActive ?? true,
        profilePicture: pictureUrl || null,
      })
      .returning();

    return sendSuccess(
      res,
      "Review created successfully",
      { review: inserted },
      status.CREATED
    );
  } catch (error) {
    console.error("Create google review error:", error);
    const message = error instanceof Error ? error.message : "Failed to create review";
    return sendError(res, message, status.BAD_REQUEST);
  }
};

/**
 * @swagger
 * /api/admin/google-reviews/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update a google review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               reviewerName:
 *                 type: string
 *               reviewText:
 *                 type: string
 *               stars:
 *                 type: integer
 *               language:
 *                 type: string
 *                 enum: [en, es]
 *               reviewLink:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 */
export const updateGoogleReview = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const id = req.params.id;
    const db = await database();
    const existing = await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.id, id));
    if (!existing.length) {
      return sendError(res, "Review not found", status.NOT_FOUND);
    }
    const record = existing[0];

    const parsed = updateReviewSchema.parse(req.body);

    let pictureUrl = record.profilePicture as string | null;
    const file =
      req.files &&
      (req.files as Record<string, Express.Multer.File[]>)?.profilePicture?.[0];
    if (file) {
      // upload new image
      const result = (await cloudinaryUploader(file.path)) as { secure_url: string };
      pictureUrl = result.secure_url;
      // remove old image if already on cloudinary
      if (record.profilePicture && record.profilePicture.includes("cloudinary.com")) {
        await cloudinaryDestroyByUrl(record.profilePicture);
      }
    }

    const [updated] = await db
      .update(googleReviews)
      .set({
        reviewerName: parsed.reviewerName ?? record.reviewerName,
        reviewText: parsed.reviewText ?? record.reviewText,
        stars: parsed.stars ?? record.stars,
        language: parsed.language ?? record.language,
        reviewLink: parsed.reviewLink ?? record.reviewLink,
        isActive: parsed.isActive ?? record.isActive,
        profilePicture: pictureUrl,
        updatedAt: new Date(),
      })
      .where(eq(googleReviews.id, id))
      .returning();

    return sendSuccess(
      res,
      "Review updated successfully",
      { review: updated },
      status.OK
    );
  } catch (error) {
    console.error("Update google review error:", error);
    const message = error instanceof Error ? error.message : "Failed to update review";
    return sendError(res, message, status.BAD_REQUEST);
  }
};

/**
 * @swagger
 * /api/admin/google-reviews/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete a google review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
export const deleteGoogleReview = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const id = req.params.id;
    const db = await database();
    const existing = await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.id, id));
    if (!existing.length) {
      return sendError(res, "Review not found", status.NOT_FOUND);
    }
    const record = existing[0];
    if (record.profilePicture && record.profilePicture.includes("cloudinary.com")) {
      await cloudinaryDestroyByUrl(record.profilePicture);
    }
    await db.delete(googleReviews).where(eq(googleReviews.id, id));
    return sendSuccess(res, "Review deleted successfully", {}, status.OK);
  } catch (error) {
    console.error("Delete google review error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to delete review",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
