const router = require("express").Router();

router.use("/auth", require("./auth.route"));
router.use("/registration", require("./register.route"));
router.use("/post", require("./post.route"));
router.use("/feed", require("./feed.route"));
router.use("/story", require("./story.route"));
router.use("/upload", require("./upload.route"));
router.use("/conversation", require("./conversation.route"));
router.use("/message", require("./message.route"));
router.use("/search", require("./search.route"));
router.use("/profile", require("./profile.route"));

module.exports = router;
