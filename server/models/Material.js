import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    storedFilename: {
      type: String,
      required: true,
    },
    sizeMb: {
      type: Number,
      required: true,
    },
    pages: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "failed"],
      default: "processing",
    },
    progress: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Material = mongoose.model("Material", MaterialSchema);

export default Material;
