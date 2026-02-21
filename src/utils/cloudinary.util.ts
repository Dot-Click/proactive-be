import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary upload utility
 */
export const cloudinaryUploader = async (filePath: string | string[]) => {
  try {
    if (!filePath) return;

    // Handle array of file paths
    if (Array.isArray(filePath)) {
      const uploadPromises = filePath.map((path) =>
        cloudinary.uploader.upload(path, {
          resource_type: "auto",
          chunk_size: 3000000, // 3MB chunk size for large files
        })
      );
      return await Promise.all(uploadPromises);
    }

    // Handle single file path
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.log("Cloudinary Upload Error:", error);
    throw error;
  }
};

/**
 * Extract public_id from a Cloudinary secure_url.
 * URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<public_id>.<ext>
 * or with folder: .../upload/v<version>/folder/<public_id>.<ext>
 */
export const getPublicIdFromCloudinaryUrl = (
  secureUrl: string
): string | null => {
  if (!secureUrl || !secureUrl.includes("cloudinary.com")) return null;
  try {
    const match = secureUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    const segment = match[1];
    // Remove file extension (e.g. .jpg, .png)
    const publicId = segment.replace(/\.[^.\/]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
};

/**
 * Delete an asset from Cloudinary by URL (extracts public_id from URL).
 * No-op if URL is not a Cloudinary URL or public_id cannot be extracted.
 */
export const cloudinaryDestroyByUrl = async (
  secureUrl: string,
  options?: { resource_type?: "image" | "video" | "raw" }
): Promise<void> => {
  const publicId = getPublicIdFromCloudinaryUrl(secureUrl);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: options?.resource_type ?? "image",
    });
  } catch (error) {
    console.error("Cloudinary destroy error:", error);
    // Don't rethrow - deletion failure should not block the response
  }
};
