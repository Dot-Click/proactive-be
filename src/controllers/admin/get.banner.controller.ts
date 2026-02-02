import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { banner } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";

/**
 * @swagger
 * /api/admin/banner:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get current banner
 *     description: Returns the current platform banner image URL. Admin only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Banner retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     banner:
 *                       type: string
 *                       nullable: true
 *                       description: URL of the current banner image, or null if not set
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export const getBanner = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const db = await database();
    const rows = await db.select({ url: banner.url }).from(banner).limit(1);

    const bannerUrl = rows.length > 0 ? rows[0].url : null;
    return sendSuccess(
      res,
      "Banner retrieved successfully",
      { banner: bannerUrl },
      status.OK
    );
  } catch (error) {
    console.error("Get banner error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to get banner",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
