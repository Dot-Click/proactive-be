import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "@/utils/token.util";
import { sendError } from "@/utils/response.util";
import status from "http-status";

/**
 * Extend Express Request to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT token
 * Expects token in Authorization header as "Bearer <token>"
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      sendError(
        res,
        "Authentication required. Please provide a valid token.",
        status.UNAUTHORIZED
      );
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      sendError(
        res,
        "Authentication required. Please provide a valid token.",
        status.UNAUTHORIZED
      );
      return;
    }

    // Verify and decode token
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    sendError(
      res,
      "Invalid or expired token. Please login again.",
      status.UNAUTHORIZED
    );
  }
};

/**
 * Middleware to check if user has a specific role
 * Must be used after authenticate middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(
        res,
        "Authentication required",
        status.UNAUTHORIZED
      );
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        "Insufficient permissions. You do not have access to this resource.",
        status.FORBIDDEN
      );
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuthenticate = (
  req: Request,
  // res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token) {
        const decoded = verifyToken(token);
        req.user = decoded;
      }
    }
  } catch (error) {
    // Ignore errors for optional authentication
  }
  next();
};
