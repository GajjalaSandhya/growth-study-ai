import mongoose from "mongoose";

const answerAttemptSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    conceptId: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
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
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    answers: [answerAttemptSchema],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

quizAttemptSchema.index({ userId: 1, projectId: 1, quizId: 1, completedAt: -1 });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
