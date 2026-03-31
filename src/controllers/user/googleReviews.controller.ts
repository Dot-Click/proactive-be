import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { database } from "@/configs/connection.config";
import { googleReviews, globalSettings } from "@/schema/schema";
import { eq, desc } from "drizzle-orm";

/**
 * @swagger
 * /api/user/google-reviews:
 *   get:
 *     tags:
 *       - User
 *     summary: Get active google reviews
 *     description: Fetch all google reviews marked as active. This endpoint is public and used by the frontend landing page.
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
export const getActiveGoogleReviews = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const db = await database();
    const rows = await db
      .select()
      .from(googleReviews)
      .where(eq(googleReviews.isActive, true))
      .orderBy(desc(googleReviews.createdAt));
    return sendSuccess(
      res,
      "Reviews fetched successfully",
      { reviews: rows },
      status.OK
    );
  } catch (error) {
    console.error("Get active google reviews error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch reviews",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * @swagger
 * /api/user/google-reviews/stats:
 *   get:
 *     tags:
 *       - User
 *     summary: Get google review aggregate stats
 *     description: Fetch the global mark and total count of reviews for display.
 *     responses:
 *       200:
 *         description: Stats fetched successfully
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
 *                     rating:
 *                       type: string
 *                     totalReviews:
 *                       type: number
 */
export const getGoogleReviewStats = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const db = await database();
    const settings = await db.select({
      mark: globalSettings.googleReviewsMark,
      count: globalSettings.googleReviewsCount
    }).from(globalSettings).limit(1);

    const data = {
      rating: settings[0]?.mark || "4.9",
      totalReviews: settings[0]?.count || 92
    };

    return sendSuccess(
      res,
      "Stats fetched successfully",
      data,
      status.OK
    );
  } catch (error) {
    console.error("Get google review stats error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch stats",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
