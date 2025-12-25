import { Socket } from "socket.io";
import { database } from "../configs/connection.config";
import { users, session } from "../schema/schema";
import { eq } from "drizzle-orm";
import { AuthenticatedSocket } from "./types";
import { verifyToken } from "../utils/token.util";

export const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const db = await database();


    try {
      const decoded = verifyToken(token);
      const userResult = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userRoles: users.userRoles,
        })
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        socket.user = {
          id: user.id,
          email: user.email,
          name: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0],
          role: user.userRoles || 'user',
        };
        return next();
      }
    } catch (jwtError) {
      return next(new Error('Invalid authentication token'));
    }


    const sessionResult = await db
      .select({
        userId: session.userId,
      })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length > 0) {
      const userId = sessionResult[0].userId;
      const userResult = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userRoles: users.userRoles,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        socket.user = {
          id: user.id,
          email: user.email,
          name: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0],
          role: user.userRoles || 'user',
        };
        return next();
      }
    }

    const userById = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        userRoles: users.userRoles,
      })
      .from(users)
      .where(eq(users.id, token))
      .limit(1);

    if (userById.length > 0) {
      const user = userById[0];
      socket.user = {
        id: user.id,
        email: user.email,
        name: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0],
        role: user.userRoles || 'user',
      };
      return next();
    }

    return next(new Error('Invalid authentication token'));
  } catch (error) {
    console.error('Socket authentication error:', error);
    return next(new Error('Authentication failed'));
  }
};

export const requireAuth = (socket: AuthenticatedSocket): boolean => {
  return !!socket.user?.id;
};

export const getUserId = (socket: AuthenticatedSocket): string => {
  if (!socket.user?.id) {
    throw new Error('User not authenticated');
  }
  return socket.user.id;
};
