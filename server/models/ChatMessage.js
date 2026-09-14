import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
    document: { type: String, required: true },
    page: { type: Number, required: true },
    excerpt: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    grounded: {
      type: Boolean,
      default: true,
    },
    unsupported: {
      type: Boolean,
      default: false,
    },
    citations: [citationSchema],
    suggestions: [{ type: String }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

// Compound index for efficient user + project history retrieval
chatMessageSchema.index({ userId: 1, projectId: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
