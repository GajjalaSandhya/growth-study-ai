import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    id: { type: String },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material" },
    document: { type: String },
    page: { type: Number },
    excerpt: { type: String },
    score: { type: Number },
  },
  { _id: false },
);

const evaluationSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    understanding: { type: Number, required: true, min: 0, max: 100 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    completeness: { type: Number, required: true, min: 0, max: 100 },
    clarity: { type: Number, required: true, min: 0, max: 100 },
    reasoning: { type: Number, required: true, min: 0, max: 100 },
    missingConcepts: [{ type: String, trim: true }],
    feedback: { type: String, required: true, trim: true },
    improvements: [{ type: String, trim: true }],
  },
  { _id: false },
);

const assessmentAttemptSchema = new mongoose.Schema(
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
      default: "general",
      trim: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    userAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    evaluation: {
      type: evaluationSchema,
      required: true,
    },
    citations: [citationSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

assessmentAttemptSchema.index({ userId: 1, projectId: 1, createdAt: -1 });
assessmentAttemptSchema.index({ userId: 1, projectId: 1, conceptId: 1 });

const AssessmentAttempt = mongoose.model("AssessmentAttempt", assessmentAttemptSchema);

export default AssessmentAttempt;
