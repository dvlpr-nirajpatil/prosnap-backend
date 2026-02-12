// // scripts/createHighlights.js

const mongoose = require("mongoose");
const User = require("./src/models/user.model");
const Highlight = require("./src/models/highlight.model");

// ✅ Replace with your MongoDB URI
const MONGO_URI =
  ""; // change as per your env

(async () => {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch users with rating > 3
    const users = await User.find({ rating: { $gt: 3 } });
    console.log(`📊 Found ${users.length} users with rating > 3`);

    let addedCount = 0;

    for (const user of users) {
      // Check if user already has an active highlight
      const existing = await Highlight.findOne({
        user: user._id,
        expiry: { $gt: new Date() },
      });

      if (existing) {
        console.log(
          `⚠️ Skipping ${user.basicDetails.firstName} — already highlighted`
        );
        continue;
      }

      // Create expiry (24 hours from now)
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create highlight
      const highlight = new Highlight({
        user: user._id,
        profilePicture: user.profilePicture,
        expiry,
        highlightedAt: new Date(),
        gender: user.basicDetails.gender,
        rating: user.rating,
      });

      await highlight.save();
      addedCount++;

      console.log(
        `✨ Highlighted ${user.basicDetails.firstName} (${user.rating})`
      );
    }

    console.log(`✅ Done! Total highlights created: ${addedCount}`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Error creating highlights:", err);
    process.exit(1);
  }
})();
