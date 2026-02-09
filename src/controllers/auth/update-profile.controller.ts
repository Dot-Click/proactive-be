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
  emergencyContact: z.string().max(100, "Emergency contact must be less than 100 characters").optional(),
  dni: z.string().max(50, "DNI must be less than 50 characters").optional(),
  dietaryRestrictions: z.string().max(200, "Diet restrictions must be less than 200 characters").optional(),
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
 *               emergencyContact:
 *                 type: string
 *                 example: +1 (555) 987-6543
 *               dni:
 *                 type: string
 *                 example: 12345678A
 *               dietaryRestrictions:
 *                 type: string
 *                 example: Vegetarian
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
        "Please check the form fields and correct any errors before submitting.",
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
  } catch (error: any) {
    console.error("Update profile error:", error);

    // Handle database constraint errors
    if (error?.cause?.code === "22001" || error?.code === "22001") {
      // Value too long for column type
      const columnMatch = error?.cause?.message?.match(/column "(\w+)"/i) || 
                         error?.message?.match(/column "(\w+)"/i);
      const columnName = columnMatch ? columnMatch[1] : "field";
      
      // Map database column names to user-friendly field names
      const fieldNameMap: Record<string, string> = {
        dietaryRestrictions: "Diet Restrictions",
        dni: "DNI",
        emergencyContact: "Emergency Contact",
        firstName: "First Name",
        lastName: "Last Name",
        nickName: "Nick Name",
        phoneNumber: "Phone Number",
      };
      
      const friendlyFieldName = fieldNameMap[columnName] || columnName;
      return sendError(
        res,
        `The ${friendlyFieldName} field is too long. Please shorten it and try again.`,
        status.BAD_REQUEST
      );
    }

    // Handle other database errors
    if (error?.cause?.code === "42703" || error?.code === "42703") {
      return sendError(
        res,
        "A database error occurred. Please try again or contact support if the problem persists.",
        status.INTERNAL_SERVER_ERROR
      );
    }

    // Handle validation errors from database
    if (error?.errors) {
      return sendError(
        res,
        "Please check your input and try again.",
        status.BAD_REQUEST,
        undefined,
        error.errors
      );
    }

    // Generic error message
    return sendError(
      res,
      error?.message || "Unable to update your profile. Please check your information and try again.",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
