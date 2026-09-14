import mongoose from "mongoose";

const errorSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["tutor", "summary", "quiz", "evaluation"],
      default: "tutor",
    },
    model: {
      type: String,
      required: true,
    },
    latencyMs: {
      type: Number,
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    grounded: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["success", "unsupported", "failed"],
      default: "success",
    },
    error: {
      type: errorSchema,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

aiLogSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

const AiLog = mongoose.model("AiLog", aiLogSchema);

export default AiLog;
