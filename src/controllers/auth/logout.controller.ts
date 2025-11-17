import { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";

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
 *     responses:
 *       200:
 *         description: User successfully logged out
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
 *                   example: Logout successful
 *       500:
 *         description: Internal server error
 */
export const logout = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return sendSuccess(res, "Logout successful", undefined, status.OK);
  } catch (error) {
    console.error("Logout error:", error);
    return sendError(
      res,
      "An error occurred during logout",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

