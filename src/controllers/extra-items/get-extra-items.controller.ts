import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { extraItems } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";

export const getExtraItems = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const db = await database();

    const results = await db
      .select({
        id: extraItems.id,
        type: extraItems.type,
        title: extraItems.title,
        description: extraItems.description,
        icon: extraItems.icon,
        createdAt: extraItems.createdAt,
        updatedAt: extraItems.updatedAt,
      })
      .from(extraItems);

    return sendSuccess(
      res,
      "Extra items retrieved successfully",
      { items: results },
      status.OK
    );
  } catch (error) {
    console.error("Get extra items error:", error);
    return sendError(
      res,
      "An error occurred while retrieving extra items",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
