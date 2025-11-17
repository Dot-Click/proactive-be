import { Ratelimit, type Duration } from "@upstash/ratelimit";
import type { RequestHandler } from "express";
import { Redis } from "@upstash/redis";
import { status } from "http-status";
import { config } from "dotenv";
config();

// Initialize Redis only if environment variables are available
let redis: Redis | null = null;
let redisAvailable = false;

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = Redis.fromEnv();
    redisAvailable = true;
  } else {
    console.warn(
      "[Rate Limiter] Upstash Redis not configured. Rate limiting disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable."
    );
  }
} catch (error) {
  console.warn(
    "[Rate Limiter] Failed to initialize Redis. Rate limiting disabled.",
    error
  );
}

export const throttle = (
  points: number,
  duration: Duration
): RequestHandler => {
  // If Redis is not available, return a middleware that just passes through
  if (!redisAvailable || !redis) {
    return (_req, _res, next) => {
      // In development without Redis, allow all requests
      next();
    };
  }

  const ratelimit = new Ratelimit({
    limiter: Ratelimit.slidingWindow(points, duration),
    prefix: "",
    redis,
  });

  return async (req, res, next) => {
    try {
      const { success } = await ratelimit.limit(req.ip || "unknown");
      if (!success) {
        return res
          .status(status.TOO_MANY_REQUESTS)
          .json({ message: "Too many requests" });
      }
      next();
    } catch (error) {
      // Log error but don't block requests if rate limiter fails
      console.error("Rate limiter error:", error);
      // In case of error, allow the request to proceed (fail open)
      // This prevents rate limiter issues from breaking the entire API
      next();
    }
  };
};
