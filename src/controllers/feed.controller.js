const { Post, Like } = require("../models");
const { response, logger } = require("../core");
const mongoose = require("mongoose");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET FEED
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔥 1️⃣ Count total posts
    const total = await Post.countDocuments({
      isDeleted: false,
      isArchived: false,
    });

    // 🔥 2️⃣ Fetch paginated posts
    const posts = await Post.find({
      isDeleted: false,
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "userName name profilePicture isVerified");

    const postIds = posts.map((post) => post._id);

    // 🔥 3️⃣ Get liked posts
    const likedPosts = await Like.find({
      userId,
      postId: { $in: postIds },
    }).select("postId");

    const likedPostIds = likedPosts.map((l) => l.postId.toString());

    // 🔥 4️⃣ Attach liked flag
    const formattedPosts = posts.map((post) => ({
      ...post.toObject(),
      liked: likedPostIds.includes(post._id.toString()),
    }));

    const totalPages = Math.ceil(total / limit);

    return response(res, 200, "Feed fetched successfully", {
      posts: formattedPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (e) {
    logger.error("GET FEED", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
