const mongoose = require("mongoose");
const adminSchema = mongoose.Schema(
  {
    email: { type: String, unique: true, trim: true, lowercase: true },
    password: { type: String, require: true },
    name: { type: String },
    role: { type: String, default: "admin" },
    blocked: { type: Boolean, default: false },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
