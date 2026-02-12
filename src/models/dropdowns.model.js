const mongoose = require("mongoose");

const dropdownSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ["occupation", "education", "hobbies"],
    required: true,
  },
  category: { type: String, required: true },
  titles: [String],
});

const Dropdowns = mongoose.model("Dropdowns", dropdownSchema);

module.exports = Dropdowns;
