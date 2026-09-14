import logger from "../utils/logger.js";

/** 404 Route Not Found Middleware */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/** Global Error Handling Middleware */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? err.statusCode || 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid resource identifier format: ${err.value}`;
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  logger.error(`API Error [${req.method} ${req.originalUrl}]:`, {
    status: statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
