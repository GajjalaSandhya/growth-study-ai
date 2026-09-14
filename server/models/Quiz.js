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

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    type: {
      type: String,
      enum: ["multiple-choice", "true-false"],
      required: true,
    },
    conceptId: { type: String, required: true, trim: true },
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (opts) {
          if (this.type === "multiple-choice") return opts.length === 4;
          if (this.type === "true-false") return opts.length === 2;
          return opts.length > 0;
        },
        message: "Multiple choice requires 4 options; True/False requires 2 options.",
      },
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      validate: {
        validator: function (idx) {
          return idx >= 0 && idx < (this.options ? this.options.length : 4);
        },
        message: "correctAnswerIndex out of option bounds",
      },
    },
    explanation: { type: String, required: true, trim: true },
    citation: { type: citationSchema, required: false },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    conceptIds: [{ type: String, trim: true }],
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    questions: [questionSchema],
    questionCount: {
      type: Number,
      required: true,
      default: 5,
    },
  },
  {
    timestamps: true,
  },
);

quizSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
