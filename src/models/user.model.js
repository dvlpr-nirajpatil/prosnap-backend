const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },

    profilePicture: {
      type: String,
      default: null,
    },

    gender: {
      type: String,

      default: null,
    },

    dob: {
      type: Date,
      default: null,
    },

    accountType: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    followersCount: {
      type: Number,
      default: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
    },

    postsCount: {
      type: Number,
      default: 0,
    },

    registration: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

userSchema.index({ userName: "text", name: "text" });

module.exports = mongoose.model("User", userSchema);
