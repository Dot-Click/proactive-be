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
import { sendCoordinatorWelcomeEmail } from "@/utils/brevo.util";
import { createNotification } from "@/services/notifications.services";

export const createCoordinator = async (req: Request, res: Response) => {
  try {
    const valid = createCoordinatorSchema.safeParse(req.body);
    if (!valid.success) {
      return sendError(res, "Invalid request body", status.BAD_REQUEST, undefined, valid.error.flatten().fieldErrors);
    }
    
    const { 
      fullName,
      phoneNumber,
      bio,
      specialities,
      languages,
      certificateLvl,
      yearsOfExperience,
      location,
      type,
      accessLvl,
      email,
      password 
    } = valid.data;
    
    let profilePictureUrl;
    if (req.files && (req.files as any).prof_pic && (req.files as any).prof_pic[0]) {
      const prof_pic = await cloudinaryUploader((req.files as any).prof_pic[0].path) as any;
      profilePictureUrl = prof_pic.secure_url as string;
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
        fullName: fullName,
        phoneNumber: phoneNumber.substring(0, 20),
        bio: bio,
        profilePicture: profilePictureUrl || null,
        specialities: specialities,
        languages: languages,
        certificateLvl: certificateLvl.substring(0, 20),
        yearsOfExperience: yearsOfExperience,
        location: location ?? null,
        type: type.substring(0, 20),
        accessLvl: accessLvl.substring(0, 20),
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
        fullName,
        password
      );
    await createNotification({
      userId: user.id,
      title: "Welcome to Proactive!",
      description: "Welcome to the team " + fullName + "!",
      type: "admin",
    });

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
      location: coordDetail.location,
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
