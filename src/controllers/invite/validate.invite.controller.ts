import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { verification } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import status from "http-status";
import { eq, gt } from "drizzle-orm";

export const validateInviteToken = async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || req.body.token;
    if (!token) {
      return sendError(res, "Token is required", status.BAD_REQUEST);
    }

    const db = await database();
    const rows = await db
      .select()
      .from(verification)
      .where(eq(verification.value, token))
      .limit(1);

    if (rows.length === 0) {
      return sendError(res, "Invalid or expired token", status.NOT_FOUND);
    }

    const row = rows[0] as any;
    const now = new Date();
    if (new Date(row.expiresAt) < now) {
      return sendError(res, "Token expired", status.GONE);
    }

    return sendSuccess(res, "Token valid", { email: row.identifier }, status.OK);
  } catch (error) {
    console.error("Validate invite token error:", error);
    return sendError(res, "An error occurred while validating token", status.INTERNAL_SERVER_ERROR);
  }
};
