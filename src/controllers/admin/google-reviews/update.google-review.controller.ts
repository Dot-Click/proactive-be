import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { googleReviews } from "@/schema/schema";
import {
    cloudinaryUploader,
    cloudinaryDestroyByUrl,
} from "@/utils/cloudinary.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import status from "http-status";

/**
 * @swagger
 * /api/admin/google-reviews/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update a Google review
 *     description: Admin updates an existing Google review. Can update any field; optionally replaces profile picture (old one is removed from Cloudinary).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Google review ID
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
 *                 minimum: 1
 *                 maximum: 5
 *               isActive:
 *                 type: boolean
 *               prof_pic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Google review updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – Admin access required
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
export const updateGoogleReview = async (
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<Response> => {
    try {
        const { id } = req.params;
        if (!id) {
            return sendError(res, "Review ID is required", status.BAD_REQUEST);
        }

        const db = await database();
        const [existing] = await db
            .select()
            .from(googleReviews)
            .where(eq(googleReviews.id, id));

        if (!existing) {
            return sendError(res, "Review not found", status.NOT_FOUND);
        }

        const { reviewerName, reviewText, stars, isActive, language, reviewLink } = req.body;
        const updateData: Partial<typeof googleReviews.$inferInsert> = {};

        if (reviewerName !== undefined) updateData.reviewerName = reviewerName;
        if (reviewText !== undefined) updateData.reviewText = reviewText;
        if (language !== undefined) updateData.language = language;
        if (reviewLink !== undefined) updateData.reviewLink = reviewLink;



        if (stars !== undefined) {
            const starsNum = Number(stars);
            if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
                return sendError(
                    res,
                    "stars must be an integer between 1 and 5",
                    status.BAD_REQUEST
                );
            }
            updateData.stars = starsNum;
        }

        if (isActive !== undefined) {
            updateData.isActive =
                isActive === "true" || isActive === true ? true : false;
        }

        // Handle profile picture replacement
        const files = req.files as Record<string, Express.Multer.File[]> | undefined;
        const profPicFile = files?.prof_pic?.[0] || files?.profilePicture?.[0];

        if (profPicFile) {
            // Upload new image
            const result = (await cloudinaryUploader(profPicFile.path)) as {
                secure_url: string;
            };
            updateData.profilePicture = result.secure_url;

            // Destroy old image if it exists on Cloudinary
            if (existing.profilePicture) {
                await cloudinaryDestroyByUrl(existing.profilePicture);
            }
        }

        const [updated] = await db
            .update(googleReviews)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(googleReviews.id, id))
            .returning();

        return sendSuccess(
            res,
            "Google review updated successfully",
            { review: updated },
            status.OK
        );
    } catch (error) {
        console.error("Update google review error:", error);
        return sendError(
            res,
            error instanceof Error ? error.message : "Failed to update google review",
            status.INTERNAL_SERVER_ERROR
        );
    }
};
