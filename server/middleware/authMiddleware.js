import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";

/**
 * Protect routes - Verification of Bearer JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, authorization token is missing",
    });
  }

  try {
    if (!config.jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not defined");
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user account no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized, session token has expired",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid session token",
    });
  }
};

/**
 * Admin authorization middleware - Restricts access to admin role
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Requires administrator privileges.",
    });
  }
  next();
};
