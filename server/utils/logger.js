/**
 * Simple structured logger utility for StudyMate AI backend
 */
const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = "") => {
    console.log(`[${getTimestamp()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn: (message, meta = "") => {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error: (message, meta = "") => {
    console.error(`[${getTimestamp()}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  debug: (message, meta = "") => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${getTimestamp()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  },
};

export default logger;
