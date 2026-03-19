import { Router } from "express";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { createDiscount } from "@/controllers/discounts/create-discount.controller";
import { validateDiscount } from "@/controllers/discounts/validate-discount.controller";
import { getDiscountsByTrip } from "@/controllers/discounts/get-discounts-by-trip.controller";
import { getAllDiscounts } from "@/controllers/discounts/get-all-discounts.controller";
import { deleteDiscount } from "@/controllers/discounts/delete-discount.controller";

const discountRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: Discounts
 *     description: Discount management endpoints
 */

// Coordinator/Admin: create, list, delete
discountRoutes.post("/", authenticate, authorize("coordinator", "admin"), createDiscount);
discountRoutes.get("/", authenticate, authorize("admin"), getAllDiscounts);
discountRoutes.get("/trip/:tripId", authenticate, authorize("coordinator", "admin"), getDiscountsByTrip);
discountRoutes.delete("/:id", authenticate, authorize("coordinator", "admin"), deleteDiscount);

// User: validate
discountRoutes.post("/validate", validateDiscount);

export default discountRoutes;
