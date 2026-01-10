import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { coordinatorDetails, users } from "@/schema/schema";
import { verifyPassword } from "@/utils/password.util";
import { generateAccessToken, generateRefreshToken } from "@/utils/token.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import { loginSchema } from "@/types/auth.types";
import status from "http-status";
import { eq } from "drizzle-orm";
import { supabase } from "@/configs/supabase.config";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: User successfully logged in
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
 *                   example: Login successful
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
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((err) => {
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

    const { email, Password } = validationResult.data;
    const db = await database();

    // Find user by email
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResults.length === 0) {
      return sendError(res, "Invalid email or password", status.UNAUTHORIZED);
    }

    const user = userResults[0];

    // Verify password
    const isPasswordValid = await verifyPassword(Password, user.password);
    if (!isPasswordValid) {
      return sendError(res, "Invalid email or password", status.UNAUTHORIZED);
    }

    if (user.userRoles === "coordinator") {
      const coordinator = await db
        .select({ isActive: coordinatorDetails.isActive })
        .from(coordinatorDetails)
        .where(eq(coordinatorDetails.userId, user.id))
        .limit(1);

      if (!coordinator.length) {
        return sendError(
          res,
          "Coordinator profile not found",
          status.FORBIDDEN
        );
      }

      if (!coordinator[0].isActive) {
        return sendError(
          res,
          "Your coordinator account has been blocked. Please contact support.",
          status.FORBIDDEN
        );
      }
    }


    // Check if email is verified - required for login
    // Set REQUIRE_EMAIL_VERIFICATION=false in .env to disable this check
    const requireEmailVerification =
      process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
    if (requireEmailVerification && !user.emailVerified) {
      return sendError(
        res,
        "Please verify your email address before logging in. Check your inbox for the verification link, or use the resend verification endpoint.",
        status.FORBIDDEN
      );
    }

    await db.update(users).set({ lastActive: new Date().toLocaleString() }).where(eq(users.id, user.id))
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

    return sendSuccess(
      res,
      "Login successful",
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.userRoles || "user",
          emailVerified: user.emailVerified || false,
        },
        accessToken,
      },
      status.OK
    );
  } catch (error) {
    console.error("Login error:", error);
    return sendError(
      res,
      "An error occurred during login",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    
    const code = req.query.code as string | undefined;
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
      if (error) {
        return res.status(400).json({ error: error.message });
      }
  
      return res.json({
        user: data.user,
        session: data.session,
      });
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.GOOGLE_REDIRECT_URL!, // same endpoint
        queryParams:{
          prompt: "select_account",
          access_type: "offline",
        }
      },
    });
  
    if (error || !data?.url) {
      return res.status(500).json({ error: "Google login failed" });
    }
  
    return sendSuccess(res, "google login successfull", data, status.OK)
  } catch (error: any) {
   return sendError(res, error?.message,status.INTERNAL_SERVER_ERROR ) 
  }
};