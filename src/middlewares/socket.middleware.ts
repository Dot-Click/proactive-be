import { NextFunction, Response, type Request } from "express";
import { IO, type RequestWithIO } from "@/types/socket";
import type { Socket } from "socket.io";
import { verifyToken } from "@/utils/token.util";

export const assignSocketToReqIO = (io: IO) => {
  return (req: Request, _: Response, next: NextFunction) => {
    (req as RequestWithIO).io = io;
    next();
  };
};

export const authorizeUser = (socket: Socket, next: (error?: any) => void) => {
  try {
    // Try to get token from handshake auth
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user data to socket
    socket.data.userId = decoded.userId;
    socket.data.email = decoded.email;
    socket.data.role = decoded.role;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
};
