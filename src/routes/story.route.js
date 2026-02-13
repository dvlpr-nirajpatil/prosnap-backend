const { story } = require("../controllers");
const { protectRoute } = require("../middlewares");
const router = require("express").Router();

router.post("/", protectRoute, story.createStory);
router.post("/:storyId/view", protectRoute, story.viewStory);
router.get("/", protectRoute, story.getStories);
router.get("/:storyId/views", protectRoute, story.getStoryViews);
router.delete("/:storyId", protectRoute, story.deleteStory);

module.exports = router;
