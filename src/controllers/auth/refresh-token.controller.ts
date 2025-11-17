import { Request, Response } from "express";
import { database } from "@/configs/connection.config";
import { users } from "@/schema/schema";
import { verifyToken, generateAccessToken, generateRefreshToken } from "@/utils/token.util";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";
import { eq } from "drizzle-orm";

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Generate a new access token using the refresh token from cookie
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
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
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return sendError(
        res,
        "Refresh token not found. Please login again.",
        status.UNAUTHORIZED
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return sendError(
        res,
        "Invalid or expired refresh token. Please login again.",
        status.UNAUTHORIZED
      );
    }

    const db = await database();

    // Verify user still exists
    const userResults = await db
      .select({
        id: users.id,
        email: users.email,
        userRoles: users.userRoles,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (userResults.length === 0) {
      return sendError(
        res,
        "User not found. Please login again.",
        status.UNAUTHORIZED
      );
    }

    const user = userResults[0];

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.userRoles || "user",
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.userRoles || "user",
    });

    // Set new refresh token as HTTP-only cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return sendSuccess(
      res,
      "Token refreshed successfully",
      {
        accessToken: newAccessToken,
      },
      status.OK
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return sendError(
      res,
      "An error occurred while refreshing token",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

