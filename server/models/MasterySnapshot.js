import mongoose from "mongoose";

const masterySnapshotSchema = new mongoose.Schema(
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
    conceptId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    masteryScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    date: {
      type: String,
      required: true,
      index: true, // YYYY-MM-DD
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

masterySnapshotSchema.index({ userId: 1, projectId: 1, conceptId: 1, date: 1 }, { unique: true });

const MasterySnapshot = mongoose.model("MasterySnapshot", masterySnapshotSchema);

export default MasterySnapshot;
