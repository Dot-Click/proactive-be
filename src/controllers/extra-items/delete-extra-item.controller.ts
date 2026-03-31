import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { extraItems } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";

export const deleteExtraItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, "Item ID is required", status.BAD_REQUEST);
    }

    const db = await database();

    const result = await db
      .delete(extraItems)
      .where(eq(extraItems.id, id))
      .returning({ id: extraItems.id });

    if (result.length === 0) {
      return sendError(res, "Extra item not found", status.NOT_FOUND);
    }

    return sendSuccess(
      res,
      "Extra item deleted successfully",
      { id: result[0].id },
      status.OK
    );
  } catch (error) {
    console.error("Delete extra item error:", error);
    return sendError(
      res,
      "An error occurred while deleting extra item",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
