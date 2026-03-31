import { Router } from "express";
import { getExtraItems } from "@/controllers/extra-items/get-extra-items.controller";
import { createExtraItem } from "@/controllers/extra-items/create-extra-item.controller";
import { updateExtraItem } from "@/controllers/extra-items/update-extra-item.controller";
import { deleteExtraItem } from "@/controllers/extra-items/delete-extra-item.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();

// Publicly accessible to see what's available
router.get("/", getExtraItems);

// Admin/Coordinator only actions
router.post("/", authenticate, createExtraItem);
router.put("/:id", authenticate, updateExtraItem);
router.delete("/:id", authenticate, deleteExtraItem);

export default router;
