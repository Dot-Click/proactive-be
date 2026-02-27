import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { googleReviews } from "@/schema/schema";
import { desc } from "drizzle-orm";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";

/**
 * @swagger
 * /api/admin/google-reviews:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all Google reviews (admin)
 *     description: Retrieve all Google reviews including inactive ones. Admin only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Google reviews fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – Admin access required
 *       500:
 *         description: Internal server error
 */
export const getGoogleReviews = async (
    _req: Request,
    res: Response,
    _next: NextFunction
): Promise<Response> => {
    try {
        const db = await database();
        const reviews = await db
            .select()
            .from(googleReviews)
            .orderBy(desc(googleReviews.createdAt));

        return sendSuccess(
            res,
            "Google reviews fetched successfully",
            { reviews },
            status.OK
        );
    } catch (error) {
        console.error("Get google reviews error:", error);
        return sendError(
            res,
            error instanceof Error ? error.message : "Failed to fetch google reviews",
            status.INTERNAL_SERVER_ERROR
        );
    }
};

/**
 * @swagger
 * /api/user/google-reviews:
 *   get:
 *     tags:
 *       - User
 *     summary: Get active Google reviews (public)
 *     description: Retrieve all active Google reviews for the frontend.
 *     responses:
 *       200:
 *         description: Google reviews fetched successfully
 *       500:
 *         description: Internal server error
 */
export const getActiveGoogleReviews = async (
    _req: Request,
    res: Response,
    _next: NextFunction
): Promise<Response> => {
    try {
        const { lang } = _req.query;
        const db = await database();
        const { eq, and } = await import("drizzle-orm");

        const conditions = [eq(googleReviews.isActive, true)];
        if (lang) {
            conditions.push(eq(googleReviews.language, String(lang)));
        }

        const reviews = await db
            .select()
            .from(googleReviews)
            .where(and(...conditions))
            .orderBy(desc(googleReviews.createdAt));


        return sendSuccess(
            res,
            "Google reviews fetched successfully",
            { reviews },
            status.OK
        );
    } catch (error) {
        console.error("Get active google reviews error:", error);
        return sendError(
            res,
            error instanceof Error ? error.message : "Failed to fetch google reviews",
            status.INTERNAL_SERVER_ERROR
        );
    }
};
