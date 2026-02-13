const { response, logger } = require("../core");
const { Story, StoryView } = require("../models");
const mongoose = require("mongoose");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// POST STORY
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/*

{
  "media": {
    "url": "https://example.com/story.jpg",
    "type": "image"
  },
  "caption": "Working on Prosnap 🚀"
}

*/

module.exports.createStory = async (req, res) => {
  try {
    const { media, caption = "" } = req.body;
    const userId = req.user.id;

    // 🔥 1️⃣ Validate media
    if (!media || !media.url || !media.type) {
      return response(res, 400, "Media is required");
    }

    if (!["image", "video"].includes(media.type)) {
      return response(res, 400, "Media type must be image or video");
    }

    // 🔥 2️⃣ Set expiry (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 🔥 3️⃣ Create story
    const story = await Story.create({
      userId,
      media: {
        url: media.url,
        type: media.type,
      },
      caption: caption.trim(),
      expiresAt,
    });

    return response(res, 201, "Story created successfully", story);
  } catch (e) {
    logger.error("CREATE STORY", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// VIEW STORY
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // 🔥 1️⃣ Validate storyId
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return response(res, 400, "Invalid story id");
    }

    // 🔥 2️⃣ Check story exists & not deleted
    const story = await Story.findOne({
      _id: storyId,
      isDeleted: false,
    });

    if (!story) {
      return response(res, 404, "Story not found");
    }

    // 🔥 3️⃣ Check expiry manually (TTL not instant)
    if (story.expiresAt < new Date()) {
      return response(res, 410, "Story expired");
    }

    // 🔥 4️⃣ Prevent duplicate view
    const existingView = await StoryView.findOne({
      storyId,
      userId,
    });

    if (!existingView) {
      // Create view record
      await StoryView.create({
        storyId,
        userId,
      });

      // Increment view count
      await Story.findByIdAndUpdate(storyId, {
        $inc: { viewsCount: 1 },
      });
    }

    return response(res, 200, "Story viewed successfully");
  } catch (e) {
    logger.error("VIEW STORY", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET STORIES
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getStories = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔥 1️⃣ Count total active stories
    const totalStories = await Story.countDocuments({
      isDeleted: false,
      expiresAt: { $gt: new Date() },
    });

    // 🔥 2️⃣ Fetch paginated active stories
    const stories = await Story.find({
      isDeleted: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "userName name profilePicture isVerified");

    if (!stories.length) {
      return response(res, 200, "No stories available", {
        stories: [],
        pagination: {
          totalStories,
          page,
          limit,
          totalPages: Math.ceil(totalStories / limit),
          hasNext: false,
          hasPrev: page > 1,
        },
      });
    }

    const storyIds = stories.map((s) => s._id);

    // 🔥 3️⃣ Get viewed stories
    const viewedStories = await StoryView.find({
      userId,
      storyId: { $in: storyIds },
    }).select("storyId");

    const viewedStoryIds = viewedStories.map((v) => v.storyId.toString());

    // 🔥 4️⃣ Group by user
    const groupedStories = {};

    stories.forEach((story) => {
      const userKey = story.userId._id.toString();

      if (!groupedStories[userKey]) {
        groupedStories[userKey] = {
          user: story.userId,
          stories: [],
        };
      }

      groupedStories[userKey].stories.push({
        ...story.toObject(),
        viewed: viewedStoryIds.includes(story._id.toString()),
      });
    });

    const totalPages = Math.ceil(totalStories / limit);

    return response(res, 200, "Stories fetched successfully", {
      stories: Object.values(groupedStories),
      pagination: {
        totalStories,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (e) {
    logger.error("GET STORIES", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET STORY VIWES
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return response(res, 400, "Invalid story id");
    }

    // 🔥 1️⃣ Check story exists
    const story = await Story.findOne({
      _id: storyId,
      isDeleted: false,
    });

    if (!story) {
      return response(res, 404, "Story not found");
    }

    // 🔥 2️⃣ Only owner can see viewers
    if (story.userId.toString() !== userId) {
      return response(
        res,
        403,
        "You are not allowed to view this story's viewers",
      );
    }

    const skip = (page - 1) * limit;

    // 🔥 3️⃣ Fetch viewers
    const viewers = await StoryView.find({ storyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "userName name profilePicture isVerified");

    const totalViews = await StoryView.countDocuments({ storyId });

    return response(res, 200, "Story viewers fetched successfully", {
      viewers,
      pagination: {
        total: totalViews,
        page,
        limit,
        totalPages: Math.ceil(totalViews / limit),
      },
    });
  } catch (e) {
    logger.error("GET STORY VIEWS", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DELETE STORY
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // 🔥 1️⃣ Validate storyId
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return response(res, 400, "Invalid story id");
    }

    // 🔥 2️⃣ Find story
    const story = await Story.findOne({
      _id: storyId,
      isDeleted: false,
    });

    if (!story) {
      return response(res, 404, "Story not found");
    }

    // 🔥 3️⃣ Check ownership
    if (story.userId.toString() !== userId) {
      return response(res, 403, "You are not allowed to delete this story");
    }

    // 🔥 4️⃣ Soft delete
    story.isDeleted = true;
    await story.save();

    // 🔥 5️⃣ Optional: remove all views for this story (cleanup)
    await StoryView.deleteMany({ storyId });

    return response(res, 200, "Story deleted successfully");
  } catch (e) {
    logger.error("DELETE STORY", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
