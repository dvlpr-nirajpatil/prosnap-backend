const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Types.ObjectId, ref: "Order", required: true },
    user: { type: mongoose.Types.ObjectId, ref: "User", required: false },
    product: { type: mongoose.Types.ObjectId, ref: "Product", required: false },

    razorpayPaymentId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String, required: true, index: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    status: { type: String },
    method: { type: String },
    captured: { type: Boolean, default: false },

    raw: { type: mongoose.Schema.Types.Mixed },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },

    invoice: { type: String, default: null },
    invoiceNumber: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
