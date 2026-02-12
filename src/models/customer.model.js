const mongoose = require("mongoose");

const customerSchema = mongoose.Schema(
  {
    name: { type: String, default: null },
    contactNo: { type: Number, required: true, unique: true },
    email: { type: String, default: null },
    gender: { type: String, enum: ["male", "female"], default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null },
    dob: { type: Date, default: null },
    age: { type: Number, default: null },
    language: { type: String, default: "marathi" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
