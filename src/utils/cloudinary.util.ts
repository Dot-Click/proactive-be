import { v2 as cloudinary } from "cloudinary";
/**
 * Cloudinary upload utility
 * TODO: Implement actual Cloudinary upload functionality
 */

export const cloudinaryUploader = async (filePath: string | string[]) => {
  try {
    if (!filePath) return;
    
    // Handle array of file paths
    if (Array.isArray(filePath)) {
      const uploadPromises = filePath.map(path => 
        cloudinary.uploader.upload(path, {
          resource_type: "auto",
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
    throw error
  }
};

