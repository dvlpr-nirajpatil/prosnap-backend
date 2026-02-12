const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    // The user who created this highlight
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // 🔹 To quickly fetch highlights by user
    },

    // List of viewers (users who viewed this highlight)
    viewedBy: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Highlight image or media
    profilePicture: {
      type: String,
      required: true,
    },

    // Expiration date (when highlight should be deleted or hidden)
    expiry: {
      type: Date,
      required: true,
      index: true, // 🔹 For automatically removing expired highlights or cron cleanup
    },

    // When highlight was created or activated
    highlightedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
      index: true, // important for fast gender-based filtering
    },

    rating: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// 🔹 Indexes for better query performance
// ---------------------------------------------------------------------------

// 1️⃣ Compound index to efficiently query highlights of a user that are still active
// Compound index for fast gender-based + expiry + rating sorting
highlightSchema.index({ gender: 1, expiry: 1, rating: -1 });

// 2️⃣ Optional TTL (Time To Live) index — if you want MongoDB to auto-delete expired highlights
// ⚠️ Note: MongoDB TTL indexes only work with a single `Date` field and delete entire docs automatically
// Uncomment below if you want highlights to auto-delete when expired:
// highlightSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

// 3️⃣ If you’ll often check “who viewed a user’s highlights”:
highlightSchema.index({ "viewedBy.id": 1 });

// ---------------------------------------------------------------------------
// 🔹 Optional Helper Methods
// ---------------------------------------------------------------------------

// Check if a highlight has expired
highlightSchema.methods.isExpired = function () {
  return new Date() > this.expiry;
};

// Add viewer safely (avoid duplicates)
highlightSchema.methods.addViewer = async function (userId) {
  const alreadyViewed = this.viewedBy.some(
    (v) => v.id.toString() === userId.toString()
  );
  if (!alreadyViewed) {
    this.viewedBy.push({ id: userId });
    await this.save();
  }
};

const Highlight = mongoose.model("Highlight", highlightSchema);
module.exports = Highlight;
