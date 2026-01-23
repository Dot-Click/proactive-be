import { Redis } from "@upstash/redis";

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
            "[Redis] Upstash Redis not configured. Caching will be disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable."
        );
    }
} catch (error) {
    console.warn(
        "[Redis] Failed to initialize Redis. Caching will be disabled.",
        error
    );
}

export { redis, redisAvailable };
