import { submitApplication } from "@/controllers/user/applications.submit.controller";
import { getInstaInfo, getReviews } from "@/controllers/user/insta&reviews.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { Router } from "express";

const userRoutes = Router();

userRoutes.get("/insta-info", getInstaInfo);
userRoutes.get("/reviews", getReviews);
userRoutes.post("/applications", authenticate, authorize("user"),upload(['video/mp4', 'video/mov']), submitApplication);

export default userRoutes;