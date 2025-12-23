import { database } from "@/configs/connection.config";
import { applications } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";


/**
 * @swagger
 * /api/coordinator/applications:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Get all applications (Coordinator/Admin)
 *     description: Retrieve all applications. Requires coordinator or admin role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications fetched successfully
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
 *                   example: Applications fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Application"
 *                   example:
 *                     - id: "clx123abc456def789"
 *                       userId: "clx123abc456def789"
 *                       tripId: "clx123abc456def789"
 *                       shortIntro: "I am a 20 year old male from the United States."
 *                       introVideo: "https://cloudinary.com/video/upload/v1234567890/intro.mp4"
 *                       dietaryRestrictions: "I am a vegetarian."
 *                       status: "pending"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       403:
 *         description: Forbidden - Coordinator or Admin role required
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
export const getAllApplications = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const db = await database();
    const application = await db.select().from(applications)
    return sendSuccess(res, "Applications fetched successfully", application);
} catch (error) {
    console.error(error);
    return sendError(res, "Failed to get all applications", 500);
  }
};