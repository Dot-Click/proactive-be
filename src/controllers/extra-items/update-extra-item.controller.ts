import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { extraItems } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { updateExtraItemSchema } from "@/types/extra-items.types";
import status from "http-status";
import { eq } from "drizzle-orm";

export const updateExtraItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, "Item ID is required", status.BAD_REQUEST);
    }

    const validationResult = updateExtraItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        validationResult.error.flatten().fieldErrors
      );
    }

    const db = await database();

    const result = await db
      .update(extraItems)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
      })
      .where(eq(extraItems.id, id))
      .returning({
        id: extraItems.id,
        type: extraItems.type,
        title: extraItems.title,
        description: extraItems.description,
        icon: extraItems.icon,
        updatedAt: extraItems.updatedAt,
      });

    if (result.length === 0) {
      return sendError(res, "Extra item not found", status.NOT_FOUND);
    }

    return sendSuccess(
      res,
      "Extra item updated successfully",
      { item: result[0] },
      status.OK
    );
  } catch (error) {
    console.error("Update extra item error:", error);
    return sendError(
      res,
      "An error occurred while updating extra item",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
