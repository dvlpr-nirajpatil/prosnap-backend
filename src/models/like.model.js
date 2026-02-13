const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// 🔥 Prevent duplicate likes (very important)
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

// 🔥 Fast lookup for post likes
likeSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model("Like", likeSchema);
