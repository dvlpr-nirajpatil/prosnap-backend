const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      requried: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    image: { type: String, default: null },
    status: { type: String, enum: ["seen", "unseen"], default: "unseen" },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
