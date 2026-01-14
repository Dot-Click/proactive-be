import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "@/utils/token.util";
import { sendError } from "@/utils/response.util";
import { supabase } from "@/configs/supabase.config";
import { users } from "@/schema/schema";
import status from "http-status";
import { database } from "@/configs/connection.config";
import { eq } from "drizzle-orm";

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
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return sendError(res, "Unauthorized", status.UNAUTHORIZED);
    }

    const token = authHeader.replace("Bearer ", "");
    try {
      const localToken = verifyToken(token);
      req.user = localToken;
      return next();
    } catch {}

    // If local JWT fails, try Supabase token
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return sendError(res, "Invalid token", status.UNAUTHORIZED);
    }

    const db = await database()
    let dbUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.user.email!))
    .limit(1)
    .execute();


    if (!dbUser || dbUser.length === 0  ) {
      return sendError(res, "Access Denied, User not found", status.NOT_FOUND);
    }
    req.user = {
      userId: dbUser[0].id,
      role: dbUser[0].userRoles!,
      email: data.user.email!,
    };

    next();
  } catch (err) {
    console.log(err);
    sendError(res, "Unauthorized", status.UNAUTHORIZED);
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
