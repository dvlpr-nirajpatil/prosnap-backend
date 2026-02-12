const mongoose = require("mongoose");

const counterSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    counter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Counter", counterSchema);
