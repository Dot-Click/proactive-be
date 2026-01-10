import { Router } from "express";
import { googleSignup, register } from "@/controllers/auth/register.controller";
import { googleAuth, login } from "@/controllers/auth/login.controller";
import { logout } from "@/controllers/auth/logout.controller";
import { refreshToken } from "@/controllers/auth/refresh-token.controller";
import { getCurrentUser } from "@/controllers/auth/get-current-user.controller";
import { verifyEmail } from "@/controllers/auth/verify-email.controller";
import { resendVerification } from "@/controllers/auth/resend-verification.controller";
import { forgotPassword } from "@/controllers/auth/forgot-password.controller";
import { resetPassword } from "@/controllers/auth/reset-password.controller";
import { changePassword } from "@/controllers/auth/change-password.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const authRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email, password, and role (user or coordinator)
 */
authRoutes.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user with email and password
 */
authRoutes.post("/login", login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Logout user by clearing the refresh token cookie
 *     security:
 *       - bearerAuth: []
 */
authRoutes.post("/logout", authenticate, logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Generate a new access token using the refresh token from cookie
 */
authRoutes.post("/refresh", refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user
 *     description: Get the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 */
authRoutes.get("/me", authenticate, getCurrentUser);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify email address
 *     description: Verify user's email address using verification token
 */
authRoutes.post("/verify-email", verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend email verification
 *     description: Resend email verification token to user's email address
 */
authRoutes.post("/resend-verification", resendVerification);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Send password reset token to user's email address
 */
authRoutes.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Reset user password using reset token
 */
authRoutes.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change password
 *     description: Change password for authenticated user
 *     security:
 *       - bearerAuth: []
 */
authRoutes.post("/change-password", authenticate, changePassword);

/**
 * @swagger
 * /api/auth/google-signin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Google signin
 *     description: Signin user with Google
 */
authRoutes.post("/google-signin", googleAuth);

/**
 * @swagger
 * /api/auth/google-signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Google signup
 *     description: Signup user with Google
 */
authRoutes.post("/google-signup", googleSignup);

export default authRoutes;
