import mongoose from "mongoose";

const SpaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Space name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      default: "Folder",
      trim: true,
    },
    projectCount: {
      type: Number,
      default: 0,
    },
    averageProgress: {
      type: Number,
      default: 0,
    },
    materials: {
      type: Number,
      default: 0,
    },
    studyTimeHours: {
      type: Number,
      default: 0,
    },
    averageMastery: {
      type: Number,
      default: 0,
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

const Space = mongoose.model("Space", SpaceSchema);

export default Space;
