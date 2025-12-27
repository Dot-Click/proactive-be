import { database } from "@/configs/connection.config";
import { coordinatorDetails, users } from "@/schema/schema";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";

export const getCoordinators = async (_req: Request, res: Response) => {
  try {
    const db = await database();
    const coordinators = await db
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
        location: coordinatorDetails.location,
        type: coordinatorDetails.type,
        accessLvl: coordinatorDetails.accessLvl,
        createdAt: coordinatorDetails.createdAt,
        updatedAt: coordinatorDetails.updatedAt,
        email: users.email,
        emailVerified: users.emailVerified,
        userCreatedAt: users.createdAt,
      })
      .from(coordinatorDetails)
      .innerJoin(users, eq(coordinatorDetails.userId, users.id));
    
    return sendSuccess(
      res,
      "Coordinators fetched successfully",
      { coordinators },
      status.OK
    );
  } catch (error) {
    console.error("Get coordinators error:", error);
    return sendError(res, "An error occurred while fetching coordinators", status.INTERNAL_SERVER_ERROR);
  }
};