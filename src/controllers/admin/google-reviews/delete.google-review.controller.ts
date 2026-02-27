import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { googleReviews } from "@/schema/schema";
import { cloudinaryDestroyByUrl } from "@/utils/cloudinary.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import status from "http-status";

/**
 * @swagger
 * /api/admin/google-reviews/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete a Google review
 *     description: Admin deletes a Google review by ID. Also removes the associated profile picture from Cloudinary if present.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Google review ID
 *     responses:
 *       200:
 *         description: Google review deleted successfully
 *       400:
 *         description: Review ID is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – Admin access required
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
export const deleteGoogleReview = async (
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

        // Remove profile picture from Cloudinary if present
        if (existing.profilePicture) {
            await cloudinaryDestroyByUrl(existing.profilePicture);
        }

        await db.delete(googleReviews).where(eq(googleReviews.id, id));

        return sendSuccess(
            res,
            "Google review deleted successfully",
            null,
            status.OK
        );
    } catch (error) {
        console.error("Delete google review error:", error);
        return sendError(
            res,
            error instanceof Error ? error.message : "Failed to delete google review",
            status.INTERNAL_SERVER_ERROR
        );
    }
};
