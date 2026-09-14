import mongoose from "mongoose";

const recentMistakeSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    selectedOption: { type: String },
    correctOption: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conceptMasterySchema = new mongoose.Schema(
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
    },
    conceptName: {
      type: String,
      required: true,
      trim: true,
    },
    masteryScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    quizAttemptsCount: {
      type: Number,
      default: 0,
    },
    quizCorrectCount: {
      type: Number,
      default: 0,
    },
    assessmentAttemptsCount: {
      type: Number,
      default: 0,
    },
    lastAssessmentScore: {
      type: Number,
      default: null,
    },
    recentMistakes: [recentMistakeSchema],
    lastPracticedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

conceptMasterySchema.index({ userId: 1, projectId: 1, conceptId: 1 }, { unique: true });

const ConceptMastery = mongoose.model("ConceptMastery", conceptMasterySchema);

export default ConceptMastery;
