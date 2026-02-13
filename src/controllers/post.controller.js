const { logger, response } = require("../core");
const { Post, Like, Comment, User } = require("../models");
const mongoose = require("mongoose");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CREATE POST
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

/*
TEST PAYLOAD
{
  "caption": "Building Prosnap 🚀 #prosnap #developer #nodejs",
  "media": [
    {
      "url": "https://example.com/image1.jpg",
      "type": "image"
    }
  ],
  "location": "Mumbai, India"
}
*/

module.exports.createPost = async (req, res) => {
  try {
    const { caption = "", media, location } = req.body;

    if (!media || !Array.isArray(media) || media.length === 0) {
      return response(res, 400, "Media is required");
    }

    for (const item of media) {
      if (!item.url || !item.type) {
        return response(res, 400, "Invalid media format");
      }

      if (!["image", "video"].includes(item.type)) {
        return response(res, 400, "Media type must be image or video");
      }
    }

    const hashtags = [];
    if (caption) {
      const matches = caption.match(/#\w+/g);
      if (matches) {
        matches.forEach((tag) =>
          hashtags.push(tag.replace("#", "").toLowerCase()),
        );
      }
    }

    const newPost = await Post.create({
      userId: req.user.id,
      caption: caption.trim(),
      media,
      location: location || null,
      hashtags,
    });

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { postsCount: 1 },
    });

    return response(res, 201, "Post created successfully", newPost);
  } catch (e) {
    logger.error("CREATE POST", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE POST
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return response(res, 400, "Invalid post id");
    }

    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      return response(res, 404, "Post not found");
    }

    if (post.userId.toString() !== req.user.id) {
      return response(res, 403, "You are not allowed to delete this post");
    }

    post.isDeleted = true;
    await post.save();

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { postsCount: -1 },
    });

    return response(res, 200, "Post deleted successfully");
  } catch (e) {
    logger.error("DELETE POST", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// LIKE / UNLIKE POST
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return response(res, 400, "Invalid post id");
    }

    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      return response(res, 404, "Post not found");
    }

    const existingLike = await Like.findOne({
      userId,
      postId,
    });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });

      await Post.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      });

      return response(res, 200, "Post unliked", {
        liked: false,
      });
    }

    await Like.create({
      userId,
      postId,
    });

    await Post.findByIdAndUpdate(postId, {
      $inc: { likesCount: 1 },
    });

    return response(res, 200, "Post liked", {
      liked: true,
    });
  } catch (e) {
    logger.error("TOGGLE LIKE", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET LIKES API
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return response(res, 400, "Invalid post id");
    }

    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      return response(res, 404, "Post not found");
    }

    const skip = (page - 1) * limit;

    const likes = await Like.find({ postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "userName name profilePicture isVerified");

    const totalLikes = await Like.countDocuments({ postId });

    return response(res, 200, "Likes fetched successfully", {
      likes,
      pagination: {
        total: totalLikes,
        page,
        limit,
        totalPages: Math.ceil(totalLikes / limit),
      },
    });
  } catch (e) {
    logger.error("GET LIKES", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ADD COMMENT API
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return response(res, 400, "Invalid post id");
    }

    if (!text || !text.trim()) {
      return response(res, 400, "Comment text is required");
    }

    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      return response(res, 404, "Post not found");
    }

    let parentComment = null;

    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return response(res, 400, "Invalid parent comment id");
      }

      parentComment = await Comment.findOne({
        _id: parentCommentId,
        postId,
        isDeleted: false,
      });

      if (!parentComment) {
        return response(res, 404, "Parent comment not found");
      }
    }

    const newComment = await Comment.create({
      postId,
      userId,
      text: text.trim(),
      parentCommentId: parentCommentId || null,
    });

    await Post.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });

    if (parentComment) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { repliesCount: 1 },
      });
    }

    return response(res, 201, "Comment added successfully", newComment);
  } catch (e) {
    logger.error("ADD COMMENT", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET COMMENTS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return response(res, 400, "Invalid post id");
    }

    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      return response(res, 404, "Post not found");
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      postId,
      parentCommentId: null,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "userName name profilePicture isVerified");

    const totalComments = await Comment.countDocuments({
      postId,
      parentCommentId: null,
      isDeleted: false,
    });

    return response(res, 200, "Comments fetched successfully", {
      comments,
      pagination: {
        total: totalComments,
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (e) {
    logger.error("GET COMMENTS", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE COMMENTS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return response(res, 400, "Invalid comment id");
    }

    const comment = await Comment.findOne({
      _id: commentId,
      isDeleted: false,
    });

    if (!comment) {
      return response(res, 404, "Comment not found");
    }

    if (comment.userId.toString() !== userId) {
      return response(res, 403, "You are not allowed to delete this comment");
    }

    comment.isDeleted = true;
    await comment.save();

    await Post.findByIdAndUpdate(comment.postId, {
      $inc: { commentsCount: -1 },
    });

    if (comment.parentCommentId) {
      await Comment.findByIdAndUpdate(comment.parentCommentId, {
        $inc: { repliesCount: -1 },
      });
    }

    return response(res, 200, "Comment deleted successfully");
  } catch (e) {
    logger.error("DELETE COMMENT", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
