import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users, verification } from "@/schema/schema";
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
import { supabase } from "@/configs/supabase.config";
import { hashPassword } from "@/utils/password.util";

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
      Password,
      FirstName,
      LastName,
      NickName,
      Address,
      PhoneNumber,
      Gender,
      DOB,
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
    const hashedPassword = await hashPassword(Password);

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        id: createId(),
        email,
        password: hashedPassword,
        userRoles: "user",
        emailVerified: false,
        firstName: FirstName || undefined,
        lastName: LastName || undefined,
        avatar: `https://ui-avatars.com/api/?name=${FirstName}+${LastName}`,
        nickName: NickName || undefined,
        address: Address || undefined,
        phoneNumber: PhoneNumber || undefined,
        gender: Gender || undefined,
        dob: DOB || undefined
      })
      .returning({
        id: users.id,
        email: users.email,
        FirstName: users.firstName,
        NickName: users.nickName,
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
      user.FirstName || undefined
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

/**
 * @swagger
 * /api/auth/google-signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Sign up with Google using Supabase OAuth
 *     description: |
 *       Creates a user account after Supabase handles Google OAuth flow.
 *       Frontend should use Supabase client to authenticate, then send the session token here.
 *       Supabase handles all OAuth redirects and token exchanges.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_token
 *             properties:
 *               session_token:
 *                 type: string
 *                 description: Supabase session access token (from session.access_token after OAuth)
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
 *     responses:
 *       201:
 *         description: User successfully registered with Google
 *       200:
 *         description: User already exists, logged in successfully
 *       400:
 *         description: Missing session token
 *       401:
 *         description: Invalid or expired session token
 *       500:
 *         description: Internal server error
 */
export const googleSignup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const code = req.query.code as string | undefined;

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user || !data.user.email) {
        return sendError(res, "OAuth failed", status.BAD_REQUEST);
      }

      const db = await database();

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.user.email))
        .limit(1);

      if (existingUser.length) {
        // optional: sign user out from Supabase
        await supabase.auth.signOut();

        return sendError(
          res,
          "User already exists. Please login instead.",
          status.CONFLICT
        );
      }

      const newUser = await db.insert(users).values({
        id: createId(),
        email: data.user.email,
        password: "",
        firstName: data.user.user_metadata?.full_name?.split(" ")[0],
        lastName: data.user.user_metadata?.full_name?.split(" ").slice(1).join(" "),
        avatar: data.user.user_metadata?.avatar_url,
        provider: "google",
        emailVerified: true,
      }).returning();

      return sendSuccess(
        res,
        "Google signup successful",
        newUser[0],
        status.CREATED
      );
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.GOOGLE_REDIRECT_URL!,
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });

    if (error || !data?.url) {
      return sendError(res, "Google signup failed", status.INTERNAL_SERVER_ERROR);
    }

    return sendSuccess(res, "sucessfully registered", data, status.OK);
  } catch (err: any) {
    return sendError(res, err.message, status.INTERNAL_SERVER_ERROR);
  }
};
