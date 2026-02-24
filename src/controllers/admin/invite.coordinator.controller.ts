import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { verification, users, coordinatorDetails } from "@/schema/schema";
import { createId } from "@paralleldrive/cuid2";
import { sendEmail, sendCoordinatorWelcomeEmail, sendCoordinatorInviteEmail } from "@/utils/brevo.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/utils/password.util";
import { createNotification } from "@/services/notifications.services";

export const inviteCoordinator = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, "Email is required", status.BAD_REQUEST);
    }

    const db = await database();

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return sendError(res, "User with this email already exists", status.CONFLICT);
    }

    // If admin supplied a password, create the account immediately and email credentials
    const suppliedPassword = (req.body && req.body.password) ? String(req.body.password).trim() : undefined;
    if (suppliedPassword) {
      // create user + minimal coordinator details
      const hashed = await hashPassword(suppliedPassword);
      const newUser = await db
        .insert(users)
        .values({
          id: createId(),
          email,
          password: hashed,
          userRoles: "coordinator",
          emailVerified: true,
        })
        .returning({ id: users.id, email: users.email });

      const user = newUser[0];

      const newCoordDetails = await db
        .insert(coordinatorDetails)
        .values({
          id: createId(),
          userId: user.id,
          fullName: "",
          phoneNumber: "",
          bio: "",
          profilePicture: null,
          specialities: [],
          languages: [],
          certificateLvl: null,
          yearsOfExperience: null,
          location: null,
          type: null,
          accessLvl: null,
        })
        .returning();

      const coordDetail = newCoordDetails[0];

      await db.update(users).set({ coordinatorDetails: coordDetail.id }).where(eq(users.id, user.id));

      // Send credentials email (welcome email includes password)
      await sendCoordinatorWelcomeEmail(email, "", suppliedPassword);
      await createNotification({ userId: user.id, title: "Welcome to Proactive!", description: "Your coordinator account has been created", type: "admin" });

      return sendSuccess(res, "Coordinator account created and credentials emailed", { email: user.email }, status.CREATED);
    }

    // Otherwise fallback to invite token + onboarding link
    const token = createId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(verification).values({
      id: createId(),
      identifier: email,
      value: token,
      expiresAt,
    });

    const frontend = process.env.FRONTEND_DOMAIN || "http://localhost:4000";
    const link = `${frontend}/coordinator/onboard?token=${token}`;

    await sendCoordinatorInviteEmail(email, link);

    return sendSuccess(res, "Invite sent successfully", { email }, status.CREATED);
  } catch (error) {
    console.error("Invite coordinator error:", error);
    return sendError(res, "An error occurred while sending invite", status.INTERNAL_SERVER_ERROR);
  }
};
