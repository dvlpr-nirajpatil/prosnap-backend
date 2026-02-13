const router = require("express").Router();

router.use("/auth", require("./auth.route"));
router.use("/registration", require("./register.route"));
router.use("/post", require("./post.route"));
router.use("/feed", require("./feed.route"));
router.use("/story", require("./story.route"));

module.exports = router;
