const mongoose = require("mongoose");

const metaSchema = mongoose.Schema(
  {
    field,
    value,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meta", metaSchema);
