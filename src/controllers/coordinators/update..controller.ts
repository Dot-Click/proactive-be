import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { Request, Response } from "express";
import status from "http-status";
import { sendError } from "@/utils/response.util";
import { database } from "@/configs/connection.config";
import { coordinatorDetails } from "@/schema/schema";
import { eq } from "drizzle-orm";
import { sendSuccess } from "@/utils/response.util";
import { createCoordinatorSchema } from "@/types/admin.types";
import { sendVerificationEmail } from "@/utils/brevo.util";



export const updateCoordinator = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let profilePictureUrl;
        if (req.files && (req.files as any).prof_pic && (req.files as any).prof_pic[0]) {
          const prof_pic = await cloudinaryUploader((req.files as any).prof_pic[0].path) as any;
          profilePictureUrl = prof_pic.secure_url as string;
        }
        const valid = createCoordinatorSchema.partial().safeParse(req.body);
        if (!valid.success) {
            return sendError(res, "Invalid request body", status.BAD_REQUEST, undefined, valid.error.flatten().fieldErrors);
        }

        const db = await database();
        const coordinator = await db.select().from(coordinatorDetails).where(eq(coordinatorDetails.id, id)).limit(1);
        if (!coordinator) {
            return sendError(res, "Coordinator not found", status.NOT_FOUND);
        }
        await db.update(coordinatorDetails).set({ profilePicture: profilePictureUrl, fullName: valid.data.fullName, notificationPref: valid.data.notificationPref }).where(eq(coordinatorDetails.id, id));
        return sendSuccess(res, "Coordinator updated successfully", coordinator, status.OK);
    } catch (error) {
        return sendError(res, "Internal server error", status.INTERNAL_SERVER_ERROR);
    }
}