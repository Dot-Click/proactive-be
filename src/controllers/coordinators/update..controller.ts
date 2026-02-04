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
    const { cid } = req.params;
    let prof_pic;
    if (req.file) {
      prof_pic = (await cloudinaryUploader((req.file as any).path)) as any;
    }
    const valid = createCoordinatorSchema.partial().safeParse(req.body);
    if (!valid.success) {
      return sendError(
        res,
        "Invalid request body",
        status.BAD_REQUEST,
        undefined,
        valid.error.flatten().fieldErrors
      );
    }

    const db = await database();
    const coordinator = await db
      .select()
      .from(coordinatorDetails)
      .where(eq(coordinatorDetails.id, cid))
      .limit(1);
    if (!coordinator) {
      return sendError(res, "Coordinator not found", status.NOT_FOUND);
    }
    const { data } = valid;
    const updatedCoordinator = await db
      .update(coordinatorDetails)
      .set({
        profilePicture: prof_pic?.secure_url,
        fullName: data.fullName,
        bio: data.bio,
        notificationPref: data.notificationPref,
        yearsOfExperience: data.yearsOfExperience,
        accessLvl: data.accessLvl,
        type: data.type,
        specialities: data.specialities,
        languages: data.languages,
        location: data.location,
        phoneNumber: data.phoneNumber,
        certificateLvl: data.certificateLvl,
      })
      .where(eq(coordinatorDetails.id, cid))
      .returning();
    return sendSuccess(
      res,
      "Coordinator updated successfully",
      updatedCoordinator,
      status.OK
    );
  } catch (error) {
    console.log(error);
    return sendError(
      res,
      "Internal server error",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
