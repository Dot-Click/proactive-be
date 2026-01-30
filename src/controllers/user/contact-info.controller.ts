import { Request, Response, NextFunction } from "express";
import { database } from "@/configs/connection.config";
import { globalSettings } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";

/**
 * @swagger
 * /api/user/contact-info:
 *   get:
 *     tags:
 *       - User
 *     summary: Get public contact info
 *     description: Retrieve contact address, phone, email and map coordinates for the Contact page. No auth required.
 *     responses:
 *       200:
 *         description: Contact info fetched successfully
 *       500:
 *         description: Internal server error
 */
export const getContactInfo = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const db = await database();
    const rows = await db
      .select({
        contactAddress: globalSettings.contactAddress,
        contactPhone: globalSettings.contactPhone,
        contactEmail: globalSettings.contactEmail,
        mapLat: globalSettings.mapLat,
        mapLng: globalSettings.mapLng,
      })
      .from(globalSettings)
      .limit(1);

    if (rows.length === 0) {
      return sendSuccess(
        res,
        "Contact info fetched successfully",
        {
          contactAddress: null,
          contactPhone: null,
          contactEmail: null,
          mapLat: null,
          mapLng: null,
        },
        status.OK
      );
    }

    const row = rows[0];
    return sendSuccess(
      res,
      "Contact info fetched successfully",
      {
        contactAddress: row.contactAddress ?? null,
        contactPhone: row.contactPhone ?? null,
        contactEmail: row.contactEmail ?? null,
        mapLat: row.mapLat ?? null,
        mapLng: row.mapLng ?? null,
      },
      status.OK
    );
  } catch (error) {
    console.error("Get contact info error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch contact info",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
