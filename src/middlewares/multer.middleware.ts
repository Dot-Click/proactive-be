import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { sendError } from "@/utils/response.util";

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (_req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

/**
 * Middleware for handling multiple file uploads using Multer.
 *
 * This middleware stores uploaded files in the `./upload` directory
 * and names them using the current timestamp followed by the original filename.
 *
 * @module uploadMiddleware
 */
const upload =
  (allowedMimeTypes: any = null) =>
    (req: Request, res: Response, next: NextFunction) => {
      multer({
        storage,
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB
        },
        fileFilter: (_req, file, cb) => {
          // If specific MIME types are allowed, validate them
          if (allowedMimeTypes) {
            if (allowedMimeTypes.includes(file.mimetype)) {
              cb(null, true);
            } else {
              cb(
                new Error(
                  `Invalid file type. Allowed types: ${allowedMimeTypes.join(
                    ", "
                  )}`
                ) as any,
                false
              );
            }
          } else {
            cb(null, true);
          }
        },
      }).fields([
        { name: "image", maxCount: 1 },
        { name: "logo", maxCount: 1 },
        { name: "banner", maxCount: 1 },
        { name: "prof_pic", maxCount: 1 },
        { name: "profilePicture", maxCount: 1 },
        { name: "cover_img", maxCount: 1 },
        { name: "tt_img", maxCount: 1 },
        { name: "gallery_images", maxCount: 8 },
        { name: "introVideo", maxCount: 1 },
        { name: "promotional_video", maxCount: 1 },
        { name: "file4", maxCount: 1 },
        { name: "day_images", maxCount: 30 }, // Support up to 30 day images
      ])(req, res, (err) => {
        if (err) {
          return sendError(res, err, 400);
        }
        next();
      });
    };

/**
 * Middleware for handling single file uploads using Multer.
 *
 * This middleware stores uploaded files fetched by specific key in the `./upload` directory
 * and names them using the current timestamp followed by the original filename.
 *
 * @module uploadMiddleware
 */
const singleUpload =
  (fieldName: string) => (req: Request, res: Response, next: NextFunction) => {
    multer({
      storage,
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
      fileFilter: (_req, _file, cb) => {
        cb(null, true);
      },
    }).single(fieldName)(req, res, (err) => {
      if (err) {
        return sendError(res, err, 400);
      }
      next();
    });
  };

export { upload, singleUpload };
