const { feed } = require("../controllers");
const { protectRoute } = require("../middlewares");
const router = require("express").Router();

router.get("/", protectRoute, feed.getFeed);

module.exports = router;
