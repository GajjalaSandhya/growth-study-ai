import mongoose from "mongoose";
import config from "./env.js";
import logger from "../utils/logger.js";

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    logger.info("Using existing MongoDB connection.");
    return;
  }

  try {
    const isSrv = config.mongoUri.startsWith("mongodb+srv://");
    const options = {
      serverSelectionTimeoutMS: 5000,
    };
    if (isSrv) {
      options.tls = true;
    }

    let conn;
    try {
      conn = await mongoose.connect(config.mongoUri, options);
    } catch (primaryErr) {
      if (!isSrv && (config.mongoUri.includes("127.0.0.1") || config.mongoUri.includes("localhost"))) {
        const socketUri = "mongodb://%2Ftmp%2Fmongodb-27018.sock/studymate_ai";
        conn = await mongoose.connect(socketUri, options);
      } else {
        throw primaryErr;
      }
    }

    if (conn.connection.readyState !== 1) {
      throw new Error(`Mongoose connection state is ${conn.connection.readyState} (expected 1).`);
    }

    const host = conn.connection.host || "socket";
    const port = conn.connection.port || "27018";
    const name = conn.connection.name || "studymate_ai";
    logger.info(`MongoDB Connected: ${host}:${port}/${name}`);
  } catch (error) {
    logger.warn(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
}

export function getDBStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const stateCode = mongoose.connection.readyState;
  return {
    state: states[stateCode] || "unknown",
    isConnected: stateCode === 1,
    host: mongoose.connection.host || "localhost",
    name: mongoose.connection.name || "studymate_ai",
  };
}

export default connectDB;

