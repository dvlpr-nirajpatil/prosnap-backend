const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    media: {
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
    },

    caption: {
      type: String,
      maxlength: 300,
      default: "",
    },

    viewsCount: {
      type: Number,
      default: 0,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// 🔥 TTL Index (auto delete after expiresAt)
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 🔥 Fast story fetch per user
storySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Story", storySchema);
