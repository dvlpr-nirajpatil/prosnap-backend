const { search } = require("../controllers");
const { protectRoute } = require("../middlewares");
const router = require("express").Router();

router.get("/users", protectRoute, search.searchUsers);
router.get("/feed", protectRoute, search.getSearchFeed);

module.exports = router;
