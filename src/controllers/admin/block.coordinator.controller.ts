import { database } from "@/configs/connection.config";
import { coordinatorDetails } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import status from "http-status";

export const toggleCoordinatorStatus = async (req: Request, res: Response) => {
    try {
        const { coordinatorId } = req.params;

        if (!coordinatorId) {
            return sendError(res, "Coordinator ID is required", status.BAD_REQUEST);
        }
        const db = await database();

        const coordinator = await db
            .select({ isActive: coordinatorDetails.isActive })
            .from(coordinatorDetails)
            .where(eq(coordinatorDetails.id, coordinatorId))
            .limit(1);

        if (!coordinator.length) {
            return sendError(res, "Coordinator not found", status.NOT_FOUND);
        }

        const newStatus = !coordinator[0].isActive;

        await db
            .update(coordinatorDetails)
            .set({ isActive: newStatus })
            .where(eq(coordinatorDetails.id, coordinatorId));

        return sendSuccess(
            res,
            `Coordinator ${newStatus ? "unblocked" : "blocked"} successfully`
        );
    } catch (error) {
        console.error("Toggle coordinator status error:", error);
        return sendError(
            res,
            "An error occurred while updating coordinator status",
            status.INTERNAL_SERVER_ERROR
        );
    }
};
