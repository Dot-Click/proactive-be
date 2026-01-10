import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { globalSettings } from "@/schema/schema";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import status from "http-status";
import { updateSettingsSchema, createSettingsSchema } from "@/types/admin.types";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/admin/settings:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update global settings
 *     description: Update platform settings. All fields are optional. Logo can be uploaded as a file. If settings don't exist, all required fields must be provided for initial creation.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: "#/components/schemas/UpdateSettingsRequest"
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateSettingsRequest"
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: "object"
 *               properties:
 *                 success:
 *                   type: "boolean"
 *                   example: true
 *                 message:
 *                   type: "string"
 *                   example: "Settings updated successfully"
 *                 data:
 *                   type: "object"
 *                   properties:
 *                     settings:
 *                       $ref: "#/components/schemas/Settings"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
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
export const updateSettings = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    // Handle logo file upload if present
    if (req.files && (req.files as any).logo && (req.files as any).logo[0]) {
      try {
        const image = (await cloudinaryUploader(
          (req.files as any).logo[0].path
        )) as any;
        req.body.logo = image.secure_url;
      } catch (error) {
        console.error("Logo upload error:", error);
        return sendError(
          res,
          "Failed to upload logo",
          status.INTERNAL_SERVER_ERROR
        );
      }
    }

    // Validate the request body (type coercion handled in Zod schema)
    const validationResult = updateSettingsSchema.safeParse(req.body);
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

    const db = await database();
    const settingsData = validationResult.data;

    // Auto-generate UUIDs for tripCategories if present
    if (settingsData.tripCategories && Array.isArray(settingsData.tripCategories)) {
      settingsData.tripCategories = settingsData.tripCategories.map((category: any) => {
        // Remove id if provided by client and generate new one
        const { id, ...categoryWithoutId } = category;
        return {
          ...categoryWithoutId,
          id: createId(),
        };
      });
    }

    // Check if settings exist
    const existingSettings = await db
      .select()
      .from(globalSettings)
      .limit(1);

    let updatedSettings;

    if (existingSettings.length > 0) {
      // Update existing settings
      const [updated] = await db
        .update(globalSettings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(globalSettings.id, existingSettings[0].id))
        .returning();

      updatedSettings = updated;
    } else {
      // Create new settings (require all required fields for creation)
      const createValidation = createSettingsSchema.safeParse(req.body);
      if (!createValidation.success) {
        const errors: Record<string, string[]> = {};
        createValidation.error.issues.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        return sendError(
          res,
          "All required fields must be provided for initial settings creation",
          status.BAD_REQUEST,
          undefined,
          errors
        );
      }

      // Auto-generate UUIDs for tripCategories
      const createData = { ...createValidation.data };
      if (createData.tripCategories && Array.isArray(createData.tripCategories)) {
        createData.tripCategories = createData.tripCategories.map((category: any) => {
          // Remove id if provided by client and generate new one
          const { id, ...categoryWithoutId } = category;
          return {
            ...categoryWithoutId,
            id: createId(),
          };
        });
      }

      const [created] = await db
        .insert(globalSettings)
        .values(createData as any)
        .returning();

      updatedSettings = created;
    }

    return sendSuccess(
      res,
      "Settings updated successfully",
      { settings: updatedSettings },
      status.OK
    );
  } catch (error) {
    console.error("Update settings error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to update settings",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get global settings
 *     description: Retrieve current platform settings (requires admin authentication)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SettingsResponse"
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
 *       404:
 *         description: Settings not found
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
export const getSettings = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const db = await database();

    const settings = await db
      .select()
      .from(globalSettings)
      .limit(1);

    if (settings.length === 0) {
      return sendError(
        res,
        "Settings not found",
        status.NOT_FOUND
      );
    }

    return sendSuccess(
      res,
      "Settings fetched successfully",
      { settings: settings[0] },
      status.OK
    );
  } catch (error) {
    console.error("Get settings error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch settings",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
