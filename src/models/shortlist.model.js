const mongoose = require("mongoose");

const shortlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    shortlistedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
  },
  { timestamps: true }
);

shortlistSchema.index({ user: 1, shortlistedUser: 1 }, { unique: true });

module.exports = mongoose.model("Shortlist", shortlistSchema);
