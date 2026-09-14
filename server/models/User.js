import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/env.js";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    avatarInitials: {
      type: String,
      trim: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Helper function to generate avatar initials
function generateInitials(name) {
  if (!name) return "SM";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Pre-save hook to hash password and set avatar initials
UserSchema.pre("save", async function (next) {
  if (this.isModified("name") || !this.avatarInitials) {
    this.avatarInitials = generateInitials(this.name);
  }

  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token using process.env.JWT_SECRET (via config.jwtSecret)
UserSchema.methods.generateToken = function () {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return jwt.sign({ id: this._id, role: this.role }, config.jwtSecret, { expiresIn: "30d" });
};

const User = mongoose.model("User", UserSchema);

export default User;
