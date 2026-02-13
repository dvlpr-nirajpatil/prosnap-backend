const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    caption: {
      type: String,
      maxlength: 2200,
      default: "",
    },

    media: [
      {
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
    ],

    location: {
      type: String,
      default: null,
    },

    hashtags: [
      {
        type: String,
        lowercase: true,
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
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
  },
  { timestamps: true },
);

// 🔥 Index for feed performance
postSchema.index({ createdAt: -1 });

// 🔥 Index for hashtag search
postSchema.index({ hashtags: 1 });

module.exports = mongoose.model("Post", postSchema);
