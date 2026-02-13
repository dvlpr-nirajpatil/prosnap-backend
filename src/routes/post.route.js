const { post } = require("../controllers");
const { protectRoute } = require("../middlewares");
const router = require("express").Router();

router.post("/", protectRoute, post.createPost);
router.post("/:postId/like", protectRoute, post.toggleLike);
router.delete("/:postId", protectRoute, post.deletePost);
router.post("/:postId/comment", protectRoute, post.addComment);
router.get("/:postId/comments", protectRoute, post.getComments);
router.delete("/comment/:commentId", protectRoute, post.deleteComment);
router.get("/:postId/likes", protectRoute, post.getLikes);

module.exports = router;
