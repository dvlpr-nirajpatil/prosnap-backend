const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    education: {
      type: Map,
      of: Number,
      default: {},
    },

    occupation: {
      type: Map,
      of: Number,
      default: {},
    },

    location: {
      type: Map,
      of: Number,
      default: {},
    },

    income: {
      type: Map,
      of: Number,
      default: {},
    },

    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 60 },
    },

    meta: {
      totalInteractions: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserPreferences", preferenceSchema);
