import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import "@/middlewares/auth.middleware"; // Import to ensure type augmentation
import status from "http-status";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  nickName: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
});

/**
 * @swagger
 * /api/auth/update-profile:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Update user profile
 *     description: Update authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               nickName:
 *                 type: string
 *                 example: @johndoe
 *               address:
 *                 type: string
 *                 example: 123 Main St, City, State 12345
 *               phoneNumber:
 *                 type: string
 *                 example: +1 (555) 123-4567
 *               dob:
 *                 type: string
 *                 example: 14/06/1995
 *               gender:
 *                 type: string
 *                 example: Male
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(
        res,
        "Authentication required",
        status.UNAUTHORIZED
      );
    }

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(req.body);
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

    const updateData = validationResult.data;
    const db = await database();

    // Check if user exists
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (userResults.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    // Update user profile
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, req.user.userId));

    return sendSuccess(
      res,
      "Profile updated successfully",
      undefined,
      status.OK
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return sendError(
      res,
      "An error occurred while updating profile",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
