import { Response } from "express";
import status from "http-status";

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Send a success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = status.OK
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    ...(data && { data }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = status.BAD_REQUEST,
  error?: string,
  errors?: Record<string, string[]>
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(error && { error }),
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};
