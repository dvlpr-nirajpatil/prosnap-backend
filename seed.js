const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

const { User, Post, Story } = require("./src/models");
const MONGO_URI =
  "mongodb+srv://devganeshdhage_db_user:Ja1Pfk7VtcDZlIYp@okbarter.snuagtg.mongodb.net/prosnap";

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to DB");

    // Optional: clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Story.deleteMany({});

    const users = [];

    console.log("🚀 Creating Users...");

    for (let i = 0; i < 100; i++) {
      const gender = i < 50 ? "male" : "female";

      const user = await User.create({
        name: faker.person.fullName(),
        userName: faker.internet
          .username()
          .toLowerCase()
          .replace(/[^a-z0-9._]/g, ""),
        email: faker.internet.email().toLowerCase(),
        password: "hashedpassword", // dummy
        bio: faker.lorem.sentence(),
        gender,
        dob: faker.date.birthdate({ min: 18, max: 35, mode: "age" }),
        profilePicture: `https://randomuser.me/api/portraits/${
          gender === "male" ? "men" : "women"
        }/${faker.number.int({ min: 1, max: 99 })}.jpg`,
        profileCompleted: true,
      });

      users.push(user);
    }

    console.log("✅ Users Created");

    console.log("🚀 Creating Posts & Stories...");

    for (const user of users) {
      // Create Post
      await Post.create({
        userId: user._id,
        caption: faker.lorem.sentence() + " #prosnap #social",
        media: [
          {
            url: `https://picsum.photos/seed/${faker.string.uuid()}/600/600`,
            type: "image",
          },
        ],
        location: faker.location.city(),
        hashtags: ["prosnap", "social"],
      });

      // Create Story
      await Story.create({
        userId: user._id,
        media: {
          url: `https://picsum.photos/seed/${faker.string.uuid()}/500/800`,
          type: "image",
        },
        caption: faker.lorem.words(5),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }

    console.log("✅ Posts & Stories Created");

    console.log("🎉 Seeding Completed Successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
