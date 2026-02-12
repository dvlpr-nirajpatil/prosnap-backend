const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    orderId: { type: Number, required: true },
    membership: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Membership",
    },
    user: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    paymentRef: { type: mongoose.Types.ObjectId, ref: "Payment" },
    razorpayOrderId: { type: String, required: true },
    status: {
      type: String,
      enum: ["created", "success", "failed", "pending"],
      default: "created",
    },
    amount: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
