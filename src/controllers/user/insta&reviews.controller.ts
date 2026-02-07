import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "@/utils/response.util";
import status from "http-status";

/**
 * @swagger
 * /api/user/insta-info:
 *   get:
 *     tags:
 *       - User
 *     summary: Get Instagram information
 *     description: Retrieve Instagram posts and user information from the proactivefuture_eu account
 *     responses:
 *       200:
 *         description: Instagram info fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/InstagramResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export const getInstaInfo = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      return sendError(
        res,
        "RAPID_API_KEY is not configured",
        status.INTERNAL_SERVER_ERROR
      );
    }

    const data = await fetch(
      `https://instagram120.p.rapidapi.com/api/instagram/posts`,
      {
        method: "POST",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "instagram120.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "proactivefuture_eu",
        }),
      }
    );

    if (!data.ok) {
      const errorText = await data.text().catch(() => "Unknown error");
      console.error(
        `Instagram API error: ${data.status} ${data.statusText}`,
        errorText
      );
      throw new Error(
        `Failed to fetch insta info: ${data.status} ${data.statusText}`
      );
    }

    const response = await data.json();

    if (!response?.result?.edges?.length) {
      return sendSuccess(
        res,
        "Insta info fetched successfully",
        { posts: [], user: null },
        status.OK
      );
    }

    const firstNode = response.result.edges[0].node;
    const user = {
      username: firstNode.user?.username || "",
      full_name: firstNode.user?.full_name || "",
      profile_pic_url: firstNode.user?.profile_pic_url || "",
      profile_link: firstNode.user?.username
        ? `https://www.instagram.com/${firstNode.user.username}/`
        : "",
    };
    const posts = response.result.edges.map((edge: any) => {
      const node = edge.node;
      const thumbnail =
        node.display_url ||
        node.thumbnail_url ||
        node?.image_versions2?.candidates?.[0]?.url ||
        null;

      return {
        id: node.id,
        code: node.code,
        caption: node.caption?.text || "",
        taken_at: node.taken_at,
        thumbnail_url: thumbnail,
        link: `https://www.instagram.com/p/${node.code}/`,
        like_count: node.like_count || 0,
        comment_count: node.comment_count || 0,
      };
    });

    return sendSuccess(
      res,
      "Insta info fetched successfully",
      { user, posts },
      status.OK
    );
  } catch (error) {
    console.error("Get insta info error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch insta info",
      status.INTERNAL_SERVER_ERROR
    );
  }
};

/** In-memory cache for reviews to reduce API calls and avoid 429 rate limits */
let reviewsCache: { reviews: Array<{ link?: string; userImage?: string; userName?: string; review?: string }>; expiresAt: number } | null = null;
const REVIEWS_CACHE_TTL_MS = 20 * 60 * 1000; // 10 minutes

/**
 * @swagger
 * /api/user/reviews:
 *   get:
 *     tags:
 *       - User
 *     summary: Get Google business reviews
 *     description: Retrieve Google business reviews. Returns empty array if API subscription is not available.
 *     responses:
 *       200:
 *         description: Reviews fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ReviewsResponse"
 *       403:
 *         description: Google Reviews API subscription required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
export const getReviews = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<Response> => {
  try {
    if (reviewsCache && reviewsCache.expiresAt > Date.now()) {
      return sendSuccess(
        res,
        "Reviews fetched successfully",
        { reviews: reviewsCache.reviews },
        status.OK
      );
    }

    const apiKey = process.env.RAPID_API_KEY;
    if (!apiKey) {
      return sendError(
        res,
        "RAPID_API_KEY is not configured",
        status.INTERNAL_SERVER_ERROR
      );
    }

    const limit = 10;
    const business_id = "0x65e285d9dffa46ab:0x3dd1b18e867e6183";
    const data = await fetch(
      `https://local-business-data.p.rapidapi.com/business-reviews?business_id=${business_id}&limit=${limit}&translate_reviews=false&sort_by=most_relevant&region=us&language=es`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "local-business-data.p.rapidapi.com",
        },
      }
    );

    if (!data.ok) {
      const errorMessage = `Failed to fetch reviews: ${data.status} ${data.statusText}`;
      console.error(
        `Google Reviews API error: ${data.status} ${data.statusText}`,
        errorMessage
      );

      if (data.status === 403) {
        return sendError(
          res,
          "Google Reviews API subscription required. Please subscribe to the API in your RapidAPI dashboard.",
          status.FORBIDDEN
        );
      }

      if (data.status === 429) {
        if (reviewsCache?.reviews?.length) {
          return sendSuccess(
            res,
            "Reviews (cached, rate limit reached). Try again later for fresh data.",
            { reviews: reviewsCache.reviews },
            status.OK
          );
        }
        return sendSuccess(
          res,
          "Reviews temporarily unavailable (rate limit). Try again later.",
          { reviews: [] },
          status.OK
        );
      }

      throw new Error(errorMessage);
    }

    const json = await data.json();

    if (!json.data || !Array.isArray(json.data)) {
      return sendSuccess(
        res,
        "Reviews fetched successfully",
        { reviews: [] },
        status.OK
      );
    }

    const reviews = json.data.map((review: any) => ({
      link: review.review_link,
      userImage: review.author_photo_url,
      userName: review.author_name,
      review: review.review_text,
    }));

    reviewsCache = {
      reviews,
      expiresAt: Date.now() + REVIEWS_CACHE_TTL_MS,
    };

    return sendSuccess(
      res,
      "Reviews fetched successfully",
      { reviews },
      status.OK
    );
  } catch (error) {
    console.error("Get reviews error:", error);
    return sendError(
      res,
      error instanceof Error ? error.message : "Failed to fetch reviews",
      status.INTERNAL_SERVER_ERROR
    );
  }
};