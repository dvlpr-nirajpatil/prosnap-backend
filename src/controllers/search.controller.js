const { User, Post, Like } = require("../models");
const { response, logger } = require("../core");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SEARCH USERS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.searchUsers = async (req, res) => {
  try {
    const { q = "" } = req.query;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;

    if (!q.trim()) {
      return response(res, 400, "Search query is required");
    }

    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const skip = (page - 1) * limit;

    const query = {
      isActive: true,
      $or: [{ userName: regex }, { name: regex }, { email: regex }],
      registration: true,
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select("userName name email profilePicture isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return response(res, 200, "Users fetched successfully", {
      users,
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
    logger.error("SEARCH USERS", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SEARCH FEED
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getSearchFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;

    const skip = (page - 1) * limit;
    const postQuery = {
      isDeleted: false,
      isArchived: false,
    };

    const [posts, total] = await Promise.all([
      Post.find(postQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "userName name profilePicture isVerified"),
      Post.countDocuments(postQuery),
    ]);

    const postIds = posts.map((post) => post._id);

    const likedPosts = await Like.find({
      userId,
      postId: { $in: postIds },
    }).select("postId");

    const likedPostIds = likedPosts.map((like) => like.postId.toString());

    const formattedPosts = posts.map((post) => ({
      ...post.toObject(),
      liked: likedPostIds.includes(post._id.toString()),
    }));

    const totalPages = Math.ceil(total / limit);

    return response(res, 200, "Search feed fetched successfully", {
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
    logger.error("SEARCH FEED", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
