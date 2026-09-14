import express from "express";
import cors from "cors";
import helmet from "helmet";
import config from "./config/env.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import requestLogger from "./middleware/loggerMiddleware.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { recoverStalledProcessingJobs } from "./services/processingPipeline.js";

const app = express();

// 1. Security & Headers Middleware
app.use(helmet());

// 2. CORS Security Foundation
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if origin is allowed
      if (!origin || config.corsOrigin.includes(origin) || config.nodeEnv === "development") {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked request from ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 3. Body Parsing Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Request Logging Middleware
app.use(requestLogger);

// 5. Mount API Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/quizzes", assessmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

// 6. Root status endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to StudyMate AI API Server",
    healthCheck: "/api/health",
    version: "1.0.0",
  });
});

// 7. Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// 8. Connect Database & Start Server
const PORT = config.port;

async function startServer() {
  try {
    await connectDB();
    await recoverStalledProcessingJobs();
  } catch (err) {
    logger.error("DB Connection Startup Warning:", err.message);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`================================================`);
    logger.info(`StudyMate AI Backend Server Running`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Port:        ${PORT}`);
    logger.info(`Health API:  http://localhost:${PORT}/api/health`);
    logger.info(`================================================`);
  });

  return server;
}

// Graceful shutdown handling
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err.message);
});

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
