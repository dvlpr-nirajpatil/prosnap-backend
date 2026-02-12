const mongoose = require("mongoose");

const membershipSchema = mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    inclusives: [String],

    price: {
      mrp: { type: Number, required: true },

      discount: {
        type: {
          type: String,
          enum: ["percentage", "flat"],
          default: "percentage",
        },
        value: { type: Number, default: 0 },
        title: { type: String, default: null },
      },

      gst: {
        enabled: { type: Boolean, default: true }, // 🔥 TOGGLE
        percentage: { type: Number, default: 18 }, // India GST
      },
    },

    tag: { type: String, default: null },
    order: { type: Number, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Membership", membershipSchema);
