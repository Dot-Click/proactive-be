import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, verification } from "@/schema/schema";
import { hashPassword } from "@/utils/password.util";
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
} from "@/utils/token.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { sendVerificationEmail } from "@/utils/brevo.util";
import { registerSchema } from "@/types/auth.types";
import status from "http-status";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email, password, and role (user or coordinator)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: Password123
 *               role:
 *                 type: string
 *                 enum: [user, coordinator]
 *                 example: user
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 example: John Doe
 *               alias:
 *                 type: string
 *                 maxLength: 100
 *                 example: Johnny
 *               fullHomeAddress:
 *                 type: string
 *                 maxLength: 500
 *                 example: 123 Main St, City, State 12345
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 example: +1-555-123-4567
 *               gender:
 *                 type: string
 *                 maxLength: 20
 *                 example: Male
 *               specialDiet:
 *                 type: string
 *                 enum: [vegetarian, vegan, gluten-free, other]
 *                 example: vegetarian
 *               specialDietOther:
 *                 type: string
 *                 maxLength: 500
 *                 description: Required when specialDiet is "other"
 *                 example: Keto diet
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         emailVerified:
 *                           type: boolean
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Internal server error
 */
export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return sendError(
        res,
        "Validation failed",
        status.BAD_REQUEST,
        undefined,
        errors
      );
    }

    const {
      email,
      password,
      role,
      name,
      alias,
      fullHomeAddress,
      phone,
      gender,
      specialDiet,
      specialDietOther,
    } = validationResult.data;
    const db = await database();

    // Check if user already exists
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        id: createId(),
        email,
        password: hashedPassword,
        userRoles: role,
        emailVerified: false,
        name: name || undefined,
        alias: alias || undefined,
        fullHomeAddress: fullHomeAddress || undefined,
        phone: phone || undefined,
        gender: gender || undefined,
        specialDiet: specialDiet || undefined,
        specialDietOther: specialDietOther || undefined,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        name: users.name,
        userRoles: users.userRoles,
        emailVerified: users.emailVerified,
      });

    const user = newUser[0];

    // Generate email verification token (5-6 digits)
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    // Create verification record
    // Ensure token is stored exactly as generated (no transformations)
    await db.insert(verification).values({
      id: createId(),
      identifier: email.trim().toLowerCase(), // Normalize email for consistency
      value: verificationToken, // Store token exactly as generated
      expiresAt,
    });

    // Send verification email using Brevo
    await sendVerificationEmail(
      email,
      verificationToken,
      user.name || user.firstName || undefined
    );

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.userRoles || "user",
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.userRoles || "user",
    });

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Prepare response data
    const responseData: {
      user: {
        id: string;
        email: string;
        role: string;
        emailVerified: boolean;
      };
      accessToken: string;
      verificationToken?: string; // Only in development
    } = {
      user: {
        id: user.id,
        email: user.email,
        role: user.userRoles || "user",
        emailVerified: user.emailVerified || false,
      },
      accessToken,
    };

    // In development mode, include verification token for testing
    // In production, this token should be sent via email
    if (process.env.NODE_ENV !== "production") {
      responseData.verificationToken = verificationToken;
    }

    return sendSuccess(
      res,
      "User registered successfully",
      responseData,
      status.CREATED
    );
  } catch (error) {
    console.error("Register error:", error);
    return sendError(
      res,
      "An error occurred during registration",
      status.INTERNAL_SERVER_ERROR
    );
  }
};
