import { database } from "@/configs/connection.config";
import { coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";

export const deleteCoordinator = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, "Coordinator ID is required", status.BAD_REQUEST);
    }
    
    const db = await database();
    
    // Check if coordinator exists
    const coordinatorResults = await db
      .select()
      .from(coordinatorDetails)
      .where(eq(coordinatorDetails.id, id))
      .limit(1);

    if (coordinatorResults.length === 0) {
      return sendError(res, "Coordinator not found", status.NOT_FOUND);
    }

    // Delete coordinatorDetails - this will cascade delete the user due to foreign key constraint
    await db.delete(coordinatorDetails).where(eq(coordinatorDetails.id, id));
    
    return sendSuccess(
      res,
      "Coordinator deleted successfully",
      {},
      status.OK
    );
  } catch (error) {
    console.error("Delete coordinator error:", error);
    return sendError(res, "An error occurred while deleting coordinator", status.INTERNAL_SERVER_ERROR);
  }
};