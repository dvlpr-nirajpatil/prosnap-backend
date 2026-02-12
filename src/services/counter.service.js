const Counter = require("../models/counter.model");

async function getNextSequence(name) {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name }, // counter name like "userId"
      { $inc: { counter: 1 } }, // increment counter by 1
      { new: true, upsert: true } // create if not exists
    );

    return counter.counter;
  } catch (err) {
    console.error("Counter increment error:", err);
    throw err;
  }
}

module.exports = {
  getNextSequence,
};
