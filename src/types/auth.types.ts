import { z } from "zod";

/**
 * User roles enum
 */
export enum UserRole {
  USER = "user",
  COORDINATOR = "coordinator",
  ADMIN = "admin",
}

/**
 * Register request body schema
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  role: z.enum(["user", "coordinator"], {
    errorMap: () => ({
      message: "Role must be either 'user' or 'coordinator'",
    }),
  }),
});

/**
 * Login request body schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Verify email request body schema
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

/**
 * Resend verification request body schema
 */
export const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * Forgot password request body schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * Reset password request body schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

/**
 * Change password request body schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

/**
 * Register request type
 */
export type RegisterRequest = z.infer<typeof registerSchema>;

/**
 * Login request type
 */
export type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Verify email request type
 */
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;

/**
 * Resend verification request type
 */
export type ResendVerificationRequest = z.infer<
  typeof resendVerificationSchema
>;

/**
 * Forgot password request type
 */
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password request type
 */
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

/**
 * Change password request type
 */
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

/**
 * Auth response type
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  accessToken: string;
}
