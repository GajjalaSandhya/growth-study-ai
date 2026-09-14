import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root .env or server/.env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://%2Ftmp%2Fmongodb-27018.sock/studymate_ai",
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:5173", "http://localhost:3000"],
  jwtSecret: process.env.JWT_SECRET || "default_jwt_secret_studymate_2026",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  embeddingDimension: parseInt(process.env.EMBEDDING_DIMENSION, 10) || 1536,
  ragTopK: parseInt(process.env.RAG_TOP_K, 10) || 4,
  ragMinScore: parseFloat(process.env.RAG_MIN_SCORE) || 0.6,
  tutorModel: process.env.TUTOR_MODEL || "gpt-4o-mini",
  tutorHistoryLimit: Math.max(1, parseInt(process.env.TUTOR_HISTORY_LIMIT, 10) || 10),
  primaryAdminEmail: process.env.PRIMARY_ADMIN_EMAIL || "admin@studymate.ai",
};

// Fail-fast validation in production mode
if (config.nodeEnv === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("default")) {
    throw new Error("FATAL: Secure JWT_SECRET must be provided in production environment.");
  }
  if (!process.env.MONGODB_URI) {
    throw new Error("FATAL: MONGODB_URI must be provided in production environment.");
  }
}

export default config;
