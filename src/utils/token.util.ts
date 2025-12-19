import jwt from "jsonwebtoken";
import { env } from "./env.utils";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/**
 * Generate a JWT refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Generate a numeric verification token (5-6 digits)
 * Randomly generates either 5 or 6 digits for better security
 */
export const generateVerificationToken = (): string => {
  // Randomly choose between 5 or 6 digits
  const length = Math.random() < 0.5 ? 5 : 6;
  
  // Generate random number with the chosen length
  const min = Math.pow(10, length - 1); // e.g., 10000 for 5 digits
  const max = Math.pow(10, length) - 1; // e.g., 99999 for 5 digits
  
  const token = Math.floor(Math.random() * (max - min + 1)) + min;
  return token.toString();
};
