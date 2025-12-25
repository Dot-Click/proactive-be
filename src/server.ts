import { prepareProductionStance } from "./configs/prepareproductionstance.config";
import { assignSocketToReqIO } from "@/middlewares/socket.middleware";
import { prepareMigration } from "./utils/preparemigration.util";
import { throttle } from "./middlewares/throttle.middleware";
import { sessionOptions } from "./configs/session.config";
import unknownRoutes from "@/routes/unknown.routes";
import apiRoutes from "@/routes";
import { swagger } from "@/configs/swagger.config";
import { logger } from "@/utils/logger.util";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createServer } from "http";
import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { cloudinaryConfig } from "@/configs/cloudinary.config";
import createSocketServer from "@/socket";

config();
const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT) || 3000;
const sessionMiddleware = session(sessionOptions);
const isProduction = app.get("env") === "production";


app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_DOMAIN,
  "http://localhost:4000",
  "http://127.0.0.1:5500",
  "https://proactive-fe.vercel.app",
].filter(Boolean) as string[];


const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
  }
  next();
});

const io = createSocketServer(httpServer, corsOptions);

swagger(app);
prepareProductionStance({ isProduction, app, sessionOptions });
prepareMigration(isProduction);
app.use(helmet());
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));
io.engine.use(sessionMiddleware);
app.use(assignSocketToReqIO(io));
app.use(express.static("dist"));
app.use(sessionMiddleware);
app.use(cookieParser());
app.use(express.json());
cloudinaryConfig();

app.use(morgan("dev"));
app.use(throttle(50, "1m")); 

// API Routes
app.use(apiRoutes);
app.use(unknownRoutes);

httpServer.listen(port as number, () => {
  logger.info(`server is running on port: ${port}`);
  logger.info(`Docs are available at \n/api/docs and /api/docs-json`);
});
