import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { verification, users, coordinatorDetails } from "@/schema/schema";
import { createId } from "@paralleldrive/cuid2";
import { sendError, sendSuccess } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/utils/password.util";
import { sendCoordinatorWelcomeEmail } from "@/utils/brevo.util";
import { createNotification } from "@/services/notifications.services";

export const completeInvite = async (req: Request, res: Response) => {
  try {
    const { token, fullName, password, phoneNumber, bio, specialities, languages, certificateLvl, yearsOfExperience, location, type, accessLvl } = req.body;
    if (!token) {
      return sendError(res, "Token is required", status.BAD_REQUEST);
    }

    const db = await database();
    const rows = await db
      .select()
      .from(verification)
      .where(eq(verification.value, token))
      .limit(1);

    if (rows.length === 0) {
      return sendError(res, "Invalid or expired token", status.NOT_FOUND);
    }

    const invite = rows[0] as any;
    if (new Date(invite.expiresAt) < new Date()) {
      return sendError(res, "Token expired", status.GONE);
    }

    const email = invite.identifier as string;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return sendError(res, "User with this email already exists", status.CONFLICT);
    }

    if (!password || !fullName) {
      return sendError(res, "fullName and password are required", status.BAD_REQUEST);
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
      .returning({ id: users.id, email: users.email });

    const user = newUser[0];

    const coord = await db
      .insert(coordinatorDetails)
      .values({
        id: createId(),
        userId: user.id,
        fullName,
        phoneNumber: phoneNumber ?? null,
        bio: bio ?? null,
        profilePicture: null,
        specialities: specialities ?? [],
        languages: languages ?? [],
        certificateLvl: certificateLvl ?? null,
        yearsOfExperience: yearsOfExperience ?? null,
        location: location ?? null,
        type: type ?? null,
        accessLvl: accessLvl ?? null,
      })
      .returning();

    const coordDetail = coord[0];

    await db.update(users).set({ coordinatorDetails: coordDetail.id }).where(eq(users.id, user.id));

    // remove the invite token
    await db.delete(verification).where(eq(verification.value, token));

    await sendCoordinatorWelcomeEmail(email, fullName, password);
    await createNotification({ userId: user.id, title: "Welcome to Proactive!", description: `Welcome ${fullName}`, type: "admin" });

    return sendSuccess(res, "Coordinator onboarding complete", { coordinator: { id: coordDetail.id, email: user.email } }, status.CREATED);
  } catch (error) {
    console.error("Complete invite error:", error);
    return sendError(res, "An error occurred while completing invite", status.INTERNAL_SERVER_ERROR);
  }
};
