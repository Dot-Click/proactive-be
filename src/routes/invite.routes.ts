import { Router } from "express";
import { validateInviteToken } from "@/controllers/invite/validate.invite.controller";
import { completeInvite } from "@/controllers/invite/complete.invite.controller";
import { upload } from "@/middlewares/multer.middleware";

const inviteRoutes = Router();

inviteRoutes.get("/validate", validateInviteToken);
inviteRoutes.post("/complete", upload(), completeInvite);

export default inviteRoutes;
