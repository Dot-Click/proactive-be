import { database } from "@/configs/connection.config";
import { trips } from "@/schema/schema";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";

export const rejectTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await database();
    const updatedTrip = await db
      .update(trips)
      .set({
        approvalStatus: "rejected",
        status: "pending",
      })
      .where(eq(trips.id, id))
      .returning();

    if (!updatedTrip.length) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({
      message: "Trip rejected successfully",
      data: updatedTrip[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
