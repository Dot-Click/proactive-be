import { logger } from "./logger.util";
import { config } from "dotenv";
import { z } from "zod";
config();

const schemaObject = z.object({
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  // GOOGLE_CLIENT_ID: z.string(),
  // BREVO_API_KEY: z.string(),
  // UPSTASH_REDIS_REST_TOKEN: z.string(),
  // UPSTASH_REDIS_REST_URL: z.string(),
  // CLOUDINARY_API_KEY: z.string(),
  // FRONTEND_DOMAIN: z.string(),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional(),
  FRONTEND_DOMAIN: z.string().optional(),
  CONNECTION_URL: z.string(),
  BACKEND_DOMAIN: z.string(),
  COOKIE_SECRET: z.string(),
  JWT_SECRET: z.string(),
  database: z.string(),
});

const envSchema = schemaObject.safeParse(process.env);

if (!envSchema.success) {
  const message = `Invalid environment variables: ${JSON.stringify(
    envSchema.error.format(),
    null,
    4
  )}`;

  logger.error(message);
  throw new Error(message);
}

export const env = envSchema.data;
