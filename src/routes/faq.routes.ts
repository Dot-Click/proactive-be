import { Router } from "express";
import { createFaq } from "@/controllers/faq/create-faq.controller";
import { getFaqs } from "@/controllers/faq/get-faqs.controller";
import { getFaq } from "@/controllers/faq/get-faq.controller";
import { updateFaq } from "@/controllers/faq/update-faq.controller";
import { deleteFaq } from "@/controllers/faq/delete-faq.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const faqRoutes = Router();

/**
 * @swagger
 * tags:
 *   - name: FAQs
 *     description: FAQ management endpoints
 */

// Public routes - anyone can view FAQs
/**
 * @swagger
 * /api/faqs:
 *   get:
 *     tags:
 *       - FAQs
 *     summary: Get all FAQs
 *     description: Retrieve all FAQs (Public endpoint)
 */
faqRoutes.get("/", getFaqs);

/**
 * @swagger
 * /api/faqs/{faqId}:
 *   get:
 *     tags:
 *       - FAQs
 *     summary: Get a specific FAQ
 *     description: Retrieve a single FAQ by ID (Public endpoint)
 */
faqRoutes.get("/:faqId", getFaq);

// Admin-only routes
/**
 * @swagger
 * /api/faqs:
 *   post:
 *     tags:
 *       - FAQs
 *     summary: Create a new FAQ
 *     description: Create a new FAQ entry (Admin only)
 *     security:
 *       - bearerAuth: []
 */
faqRoutes.post("/", authenticate, authorize("admin"), createFaq);

/**
 * @swagger
 * /api/faqs/{faqId}:
 *   put:
 *     tags:
 *       - FAQs
 *     summary: Update a FAQ
 *     description: Update an existing FAQ entry (Admin only)
 *     security:
 *       - bearerAuth: []
 */
faqRoutes.put("/:faqId", authenticate, authorize("admin"), updateFaq);

/**
 * @swagger
 * /api/faqs/{faqId}:
 *   delete:
 *     tags:
 *       - FAQs
 *     summary: Delete a FAQ
 *     description: Delete an existing FAQ entry (Admin only)
 *     security:
 *       - bearerAuth: []
 */
faqRoutes.delete("/:faqId", authenticate, authorize("admin"), deleteFaq);

export default faqRoutes;
