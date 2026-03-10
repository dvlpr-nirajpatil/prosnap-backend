const mongoose = require("mongoose");
const { User, Post } = require("../models");
const { response, logger } = require("../core");

const getPlaceholderCount = (storedCount, min, max) => {
  if (typeof storedCount === "number" && storedCount > 0) {
    return storedCount;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET PROFILE DETAILS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getProfileDetails = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return response(res, 400, "Invalid user id");
    }

    const user = await User.findOne({
      _id: targetUserId,
      isActive: true,
      registration: true,
    }).select(
      "userName name email bio profilePicture isVerified accountType followersCount followingCount postsCount",
    );

    if (!user) {
      return response(res, 404, "Profile not found");
    }

    const posts = await Post.find({
      userId: user._id,
      isDeleted: false,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .select("caption media location likesCount commentsCount createdAt")
      .lean();

    const followers = getPlaceholderCount(user.followersCount, 120, 12000);
    const following = getPlaceholderCount(user.followingCount, 80, 3500);
    const postsCount =
      typeof user.postsCount === "number" && user.postsCount > 0
        ? user.postsCount
        : posts.length;

    const profile = {
      _id: user._id,
      userName: user.userName,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      accountType: user.accountType,
      counts: {
        posts: postsCount,
        followers,
        following,
      },
      posts,
    };

    return response(res, 200, "Profile fetched successfully", profile);
  } catch (e) {
    logger.error("GET PROFILE DETAILS", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
