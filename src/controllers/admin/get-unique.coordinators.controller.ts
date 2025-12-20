import { database } from "@/configs/connection.config";
import { coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";

export const getCoordinatorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return sendError(res, "Coordinator ID is required", status.BAD_REQUEST);
    }

    const db = await database();
    const coordinatorResults = await db
      .select({
        id: coordinatorDetails.id,
        userId: coordinatorDetails.userId,
        fullName: coordinatorDetails.fullName,
        phoneNumber: coordinatorDetails.phoneNumber,
        bio: coordinatorDetails.bio,
        profilePicture: coordinatorDetails.profilePicture,
        specialities: coordinatorDetails.specialities,
        languages: coordinatorDetails.languages,
        certificateLvl: coordinatorDetails.certificateLvl,
        yearsOfExperience: coordinatorDetails.yearsOfExperience,
        type: coordinatorDetails.type,
        accessLvl: coordinatorDetails.accessLvl,
        createdAt: coordinatorDetails.createdAt,
        updatedAt: coordinatorDetails.updatedAt,
        email: users.email,
        emailVerified: users.emailVerified,
        userCreatedAt: users.createdAt,
      })
      .from(coordinatorDetails)
      .innerJoin(users, eq(coordinatorDetails.userId, users.id))
      .where(eq(coordinatorDetails.id, id))
      .limit(1);

    if (coordinatorResults.length === 0) {
      return sendError(res, "Coordinator not found", status.NOT_FOUND);
    }

    return sendSuccess(
      res,
      "Coordinator fetched successfully",
      { coordinator: coordinatorResults[0] },
      status.OK
    );
  } catch (error) {
    console.error("Get coordinator by id error:", error);
    return sendError(res, "An error occurred while fetching coordinator", status.INTERNAL_SERVER_ERROR);
  }
};