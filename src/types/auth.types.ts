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
export const registerSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    FirstName: z.string(),
    LastName: z.string(),
    NickName: z.string().optional(),
    PhoneNumber: z
      .string()
      .max(20, "Phone number must be less than 20 characters")
      .min(9, "Phone number must be at least 9 characters")
      .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format"),
    DOB: z.string(),
    Gender: z.string(),
    EmergencyContact: z.string().optional(),
    DietRestrictions: z.string().optional(),
    DNI: z.string().optional(),
    Address: z.string(),
    Password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    // role: z.string()
    // name: z
    //   .string()
    //   .max(200, "Name must be less than 200 characters")
    //   .optional(),
    // alias: z
    //   .string()
    //   .max(100, "Alias must be less than 100 characters")
    //   .optional(),
    // fullHomeAddress: z
    //   .string()
    //   .max(500, "Address must be less than 500 characters")
    //   .optional(),
    // phone: z
    //   .string()
    //   .max(20, "Phone number must be less than 20 characters")
    //   .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format")
    //   .optional(),
    // gender: z
    //   .string()
    //   .max(20, "Gender must be less than 20 characters")
    //   .optional(),
    // specialDiet: z
    //   .enum(["vegetarian", "vegan", "gluten-free", "other"], {
    //     errorMap: () => ({
    //       message:
    //         "Special diet must be one of: vegetarian, vegan, gluten-free, or other",
    //     }),
    //   })
    //   .optional(),
    // specialDietOther: z
    //   .string()
    //   .max(500, "Special diet description must be less than 500 characters")
    //   .optional(),
  })
// .refine(
//   (data) => {
//     // If specialDiet is "other", specialDietOther should be provided
//     if (data.specialDiet === "other" && !data.specialDietOther) {
//       return false;
//     }
//     return true;
//   },
//   {
//     message: "Special diet description is required when diet type is 'other'",
//     path: ["specialDietOther"],
//   }
// );

/**
 * Login request body schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  Password: z.string().min(1, "Password is required"),
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
