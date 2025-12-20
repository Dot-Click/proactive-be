import { database } from "@/configs/connection.config";
import { users, coordinatorDetails } from "@/schema/schema";
import { createCoordinatorSchema } from "@/types/admin.types";
import { cloudinaryUploader } from "@/utils/cloudinary.util";
import { hashPassword } from "@/utils/password.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import { Request, Response } from "express";
import status from "http-status";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { generateAccessToken, generateRefreshToken, generateVerificationToken } from "@/utils/token.util";
import { sendCoordinatorWelcomeEmail, sendVerificationEmail } from "@/utils/brevo.util";

export const createCoordinator = async (req: Request, res: Response) => {
  try {
    const valid = createCoordinatorSchema.safeParse(req.body);
    if (!valid.success) {
      return sendError(res, "Invalid request body", status.BAD_REQUEST, undefined, valid.error.flatten().fieldErrors);
    }
    
    const { coordinatorDetails: coordDetails, email, password } = valid.data;
    
    // Handle profile picture upload if file exists
    if (req.files && (req.files as any).prof_pic && (req.files as any).prof_pic[0]) {
      const prof_pic = await cloudinaryUploader((req.files as any).prof_pic[0].path) as any;
      coordDetails.profilePicture = prof_pic.secure_url as string;
    }

    const db = await database();

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return sendError(
        res,
        "User with this email already exists",
        status.CONFLICT
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await db
      .insert(users)
      .values({
        id: createId(),
        email,
        password: hashedPassword,
        userRoles: "coordinator",
        emailVerified: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        userRoles: users.userRoles,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      });

    const user = newUser[0];

    const newCoordDetails = await db
      .insert(coordinatorDetails)
      .values({
        id: createId(),
        userId: user.id,
        fullName: coordDetails.fullName,
        phoneNumber: coordDetails.phoneNumber,
        bio: coordDetails.bio,
        profilePicture: coordDetails.profilePicture,
        specialities: coordDetails.specialities,
        languages: coordDetails.languages,
        certificateLvl: coordDetails.certificateLvl,
        yearsOfExperience: coordDetails.yearsOfExperience,
        type: coordDetails.type,
        accessLvl: coordDetails.accessLvl,
      })
      .returning();

    const coordDetail = newCoordDetails[0];

    // Update user with coordinatorDetails reference
    await db
      .update(users)
      .set({ coordinatorDetails: coordDetail.id })
      .where(eq(users.id, user.id));

      await sendCoordinatorWelcomeEmail(
        email,
        coordDetail.fullName || undefined,
        password
      );



    // Return coordinator with user info
    const coordinatorResponse = {
      id: coordDetail.id,
      userId: user.id,
      fullName: coordDetail.fullName,
      phoneNumber: coordDetail.phoneNumber,
      bio: coordDetail.bio,
      profilePicture: coordDetail.profilePicture,
      specialities: coordDetail.specialities,
      languages: coordDetail.languages,
      certificateLvl: coordDetail.certificateLvl,
      yearsOfExperience: coordDetail.yearsOfExperience,
      type: coordDetail.type,
      accessLvl: coordDetail.accessLvl,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: coordDetail.createdAt,
      updatedAt: coordDetail.updatedAt,
      userCreatedAt: user.createdAt,
    };

    return sendSuccess(
      res,
      "Coordinator created successfully",
      {
        coordinator: coordinatorResponse,
      },
      status.CREATED
    );
  } catch (error) {
    console.error("Create coordinator error:", error);
    return sendError(res, "An error occurred while creating coordinator", status.INTERNAL_SERVER_ERROR);
  }
};
