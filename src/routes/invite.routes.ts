import { Router } from "express";
import { validateInviteToken } from "@/controllers/invite/validate.invite.controller";
import { completeInvite } from "@/controllers/invite/complete.invite.controller";

const inviteRoutes = Router();

inviteRoutes.get("/validate", validateInviteToken);
inviteRoutes.post("/complete", completeInvite);

export default inviteRoutes;
