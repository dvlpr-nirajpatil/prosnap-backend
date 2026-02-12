const mongoose = require("mongoose");

const recentlyViewedSchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    viewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  { timestamps: true }
);

recentlyViewedSchema.index({ viewer: 1, viewedUser: 1 }, { unique: true });

module.exports = mongoose.model("RecentlyViewed", recentlyViewedSchema);
