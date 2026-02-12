const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    refreshToken: {
      token: {
        type: String,
        required: true,
        select: false,
      },
      expiry: {
        type: Date,
        required: true,
        // ❌ remove index: true from here
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// ✅ Keep only this TTL index
sessionSchema.index({ "refreshToken.expiry": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Session", sessionSchema);
