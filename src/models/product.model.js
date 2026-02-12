const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["plan"], default: "plan" },
    name: { type: String, required: true },
    price: {
      mrp: { type: Number, required: true },
      gst: { type: Boolean, default: false },
    },
    plan: String,
    duration: Number,
    offer: {
      discount: { type: Number, default: null },
      price: { type: Number, default: null },
      validTill: { type: Date, default: null },
    },
    tag: { type: String, default: null },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
