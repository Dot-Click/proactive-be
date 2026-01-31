import authRoutes from "./auth.routes";
import chatRoutes from "./chat.routes";
import faqRoutes from "./faq.routes";
import categoryRoutes from "./category.routes";
import tripRoutes from "./trip.routes";
import notificationRoutes from "./notification.routes";
import paymentRoutes from "./payment.routes";
import userRoutes from "./user.routes";
import coordinatorRoutes from "./coordinator.routes";
import adminRoutes from "./admin.routes";
import { Router } from "express";

export const apiRoutes = Router();

apiRoutes.use("/api/auth", authRoutes);
apiRoutes.use("/api/chat", chatRoutes);
apiRoutes.use("/api/faqs", faqRoutes);
apiRoutes.use("/api/categories", categoryRoutes);
apiRoutes.use("/api/trips", tripRoutes);
apiRoutes.use("/api/notification", notificationRoutes);
apiRoutes.use("/api/payment", paymentRoutes);
apiRoutes.use("/api/user", userRoutes);
apiRoutes.use("/api/coordinator", coordinatorRoutes);
apiRoutes.use("/api/admin", adminRoutes);
 

export default apiRoutes;
