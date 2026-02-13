const mongoose = require("mongoose");

const storyViewSchema = new mongoose.Schema(
  {
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// 🔥 Prevent duplicate views
storyViewSchema.index({ storyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("StoryView", storyViewSchema);
