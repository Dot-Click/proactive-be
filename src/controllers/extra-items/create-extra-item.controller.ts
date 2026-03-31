import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { extraItems } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { createExtraItemSchema } from "@/types/extra-items.types";
import status from "http-status";
import { createId } from "@paralleldrive/cuid2";

export const createExtraItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const validationResult = createExtraItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        validationResult.error.flatten().fieldErrors
      );
    }

    const { type, title, description, icon } = validationResult.data;
    const db = await database();

    const newItem = await db
      .insert(extraItems)
      .values({
        id: createId(),
        type,
        title,
        description: description || null,
        icon: icon || null,
      })
      .returning({
        id: extraItems.id,
        type: extraItems.type,
        title: extraItems.title,
        description: extraItems.description,
        icon: extraItems.icon,
        createdAt: extraItems.createdAt,
        updatedAt: extraItems.updatedAt,
      });

    return sendSuccess(
      res,
      "Extra item created successfully",
      { item: newItem[0] },
      status.CREATED
    );
  } catch (error) {
    console.error("Create extra item error:", error);
    return sendError(
      res,
      "An error occurred while creating extra item",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
