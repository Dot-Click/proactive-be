import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { googleReviews } from "@/schema/schema";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";

/**
 * @swagger
 * /api/admin/google-reviews:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a Google review
 *     description: Admin creates a new Google review entry with reviewer name, review text, star rating, and optional profile picture.
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
 *             properties:
 *               reviewerName:
 *                 type: string
 *               reviewText:
 *                 type: string
 *               stars:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               prof_pic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Google review created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – Admin access required
 *       500:
 *         description: Internal server error
 */
export const createGoogleReview = async (
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<Response> => {
    try {
        const { reviewerName, reviewText, stars, language, reviewLink } = req.body;

        if (!reviewerName || !reviewText || stars === undefined) {
            return sendError(
                res,
                "reviewerName, reviewText, and stars are required",
                status.BAD_REQUEST
            );
        }

        const starsNum = Number(stars);
        if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
            return sendError(
                res,
                "stars must be an integer between 1 and 5",
                status.BAD_REQUEST
            );
        }

        const files = req.files as Record<string, Express.Multer.File[]> | undefined;
        const profPicFile = files?.prof_pic?.[0] || files?.profilePicture?.[0];

        let profilePictureUrl: string | null = null;
        if (profPicFile) {
            const result = (await cloudinaryUploader(profPicFile.path)) as {
                secure_url: string;
            };
            profilePictureUrl = result.secure_url;
        }

        const db = await database();
        const [review] = await db
            .insert(googleReviews)
            .values({
                reviewerName,
                reviewText,
                stars: starsNum,
                language: language || "en",
                reviewLink: reviewLink || null,
                ...(profilePictureUrl ? { profilePicture: profilePictureUrl } : {}),
            })
            .returning();



        return sendSuccess(
            res,
            "Google review created successfully",
            { review },
            status.CREATED
        );
    } catch (error) {
        console.error("Create google review error:", error);
        return sendError(
            res,
            error instanceof Error ? error.message : "Failed to create google review",
            status.INTERNAL_SERVER_ERROR
        );
    }
};
