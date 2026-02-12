const mongoose = require("mongoose");

const updateSchema = mongoose.Schema(
  {
    app: { type: String, enum: ["admin", "customer"], default: "customer" },
    version: { type: String, required: true },
    type: { type: String, enum: ["soft", "hard"], default: "soft" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Update", updateSchema);
