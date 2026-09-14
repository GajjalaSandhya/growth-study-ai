import morgan from "morgan";
import logger from "../utils/logger.js";

// Custom format for HTTP request logger
const morganFormat = ":method :url :status :res[content-length] - :response-time ms";

export const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});

export default requestLogger;
