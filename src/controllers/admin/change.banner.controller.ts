import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { banner } from "@/schema/schema";
import {
  cloudinaryUploader,
  cloudinaryDestroyByUrl,
} from "@/utils/cloudinary.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import status from "http-status";

/**
 * @swagger
 * /api/admin/banner:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Change banner image
 *     description: Upload a new banner image. Admin only. Accepts multipart/form-data with field "banner". Replaces the current platform banner.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - banner
 *             properties:
 *               banner:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file (JPEG, PNG, JPG)
 *     responses:
 *       200:
 *         description: Banner updated successfully
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
 *                   example: "Banner updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     banner:
 *                       type: string
 *                       description: URL of the uploaded banner image
 *       400:
 *         description: Bad request - No banner file provided
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
 *       404:
 *         description: Banner record not found (should not occur after first upload)
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
export const changeBanner = async (
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const bannerFile =
      req.files &&
      (req.files as Record<string, Express.Multer.File[]>)?.banner?.[0];
    if (!bannerFile) {
      return sendError(res, "Banner image is required", status.BAD_REQUEST);
    }

    const db = await database();
    const existing = await db.select().from(banner).limit(1);

    const previousUrl = existing.length > 0 ? existing[0].url : null;

    let bannerUrl: string;
    try {
      const result = (await cloudinaryUploader(bannerFile.path)) as {
        secure_url: string;
      };
      bannerUrl = result.secure_url;
    } catch (error) {
      console.error("Banner upload error:", error);
      return sendError(
        res,
        "Failed to upload banner image",
        status.INTERNAL_SERVER_ERROR
      );
    }

    if (previousUrl && previousUrl.includes("cloudinary.com")) {
      await cloudinaryDestroyByUrl(previousUrl);
    }

    let bannerUrlOut: string;
    if (existing.length > 0) {
      const [updated] = await db
        .update(banner)
        .set({ url: bannerUrl, updatedAt: new Date() })
        .where(eq(banner.id, existing[0].id))
        .returning({ url: banner.url });
      bannerUrlOut = updated?.url ?? bannerUrl;
    } else {
      const [inserted] = await db
        .insert(banner)
        .values({
          id: createId(),
          url: bannerUrl,
        })
        .returning({ url: banner.url });
      bannerUrlOut = inserted?.url ?? bannerUrl;
    }

    return sendSuccess(
      res,
      "Banner updated successfully",
      { banner: bannerUrlOut },
      status.OK
    );
  } catch (error) {
    console.error("Change banner error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to change banner",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
