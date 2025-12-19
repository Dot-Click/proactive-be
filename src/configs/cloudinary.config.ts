import { v2 as cloudinary } from "cloudinary";

/**
 * cloudinary configuration function and uploader
 * @returns cloudinary configuration object and cloudinary uploader
 */
export const cloudinaryConfig = () =>
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });