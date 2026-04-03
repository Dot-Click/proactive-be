import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users } from "@/schema/schema";
import { sendSuccess, sendError } from "@/utils/response.util";
import { cloudinaryUploader, cloudinaryDestroyByUrl } from "@/utils/cloudinary.util";
import status from "http-status";
import { eq } from "drizzle-orm";

export const updateAvatar = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", status.UNAUTHORIZED);
    }

    const file = req.file;
    if (!file) {
      return sendError(res, "No folder file provided", status.BAD_REQUEST);
    }

    const db = await database();

    // Get current user to check for existing avatar to delete
    const currentUser = await db
      .select({ avatar: users.avatar })
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    if (currentUser.length === 0) {
      return sendError(res, "User not found", status.NOT_FOUND);
    }

    const oldAvatarUrl = currentUser[0].avatar;

    // Upload new avatar to Cloudinary
    const uploadResult = (await cloudinaryUploader(file.path)) as any;
    const newAvatarUrl = uploadResult.secure_url;

    // Update user record
    await db
      .update(users)
      .set({ avatar: newAvatarUrl })
      .where(eq(users.id, req.user.userId));

    // Delete old avatar from Cloudinary if it exists
    if (oldAvatarUrl) {
      await cloudinaryDestroyByUrl(oldAvatarUrl);
    }

    return sendSuccess(
      res,
      "Avatar updated successfully",
      { avatar: newAvatarUrl },
      status.OK
    );
  } catch (error: any) {
    console.error("Update avatar error:", error);
    return sendError(
      res,
      error?.message || "Unable to update avatar. Please try again.",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
