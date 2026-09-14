import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    spaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      default: "General",
      trim: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    masteryScore: {
      type: Number,
      default: 0,
    },
    conceptsMastered: {
      type: Number,
      default: 0,
    },
    conceptCount: {
      type: Number,
      default: 0,
    },
    materialCount: {
      type: Number,
      default: 0,
    },
    quizAccuracy: {
      type: Number,
      default: 0,
    },
    studyTimeHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "needs-review"],
      default: "in-progress",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Project = mongoose.model("Project", ProjectSchema);

export default Project;
