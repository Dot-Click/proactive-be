import { submitApplication } from "@/controllers/user/applications.submit.controller";
import { getInstaInfo, getReviews } from "@/controllers/user/insta&reviews.controller";
import { getUserAchievementsController } from "@/controllers/user/get.achievements.controller";
import { dashboard } from "@/controllers/user/dashboard.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { Request, Response, Router } from "express";
import { sendSMS } from "@/utils/brevo.util";
import { sendError, sendSuccess } from "@/utils/response.util";
import status from "http-status";
import { deleteAuthUser, getuserSettings } from "@/controllers/user/settings.controller";

const userRoutes = Router();

userRoutes.get("/dashboard", authenticate, authorize("user", "admin"), dashboard);
userRoutes.get("/insta-info", getInstaInfo);
userRoutes.get("/reviews", getReviews);
userRoutes.get("/settings",authenticate, authorize('user'), getuserSettings);
userRoutes.delete("/deleteMe", authenticate, authorize("user"), deleteAuthUser)
userRoutes.post("/applications", authenticate, authorize("user","admin"),upload(['video/mp4', 'video/mov']), submitApplication);
userRoutes.get("/achievements", authenticate, authorize("user","admin"), getUserAchievementsController);

export default userRoutes;