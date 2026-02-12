require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./src/models/user.model");

const MONGO_URI = process.env.DB_URL;

(async () => {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    //----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    // SCRIPT AREA
    //----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const users = await User.find({
      "profileStatus.verification": true,
    }).select("profilePicture photos");

    console.log(users.slice(0, 10));

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    process.exit(1);
  }
})();
