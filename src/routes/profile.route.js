const router = require("express").Router();
const { profile } = require("../controllers");
const { protectRoute } = require("../middlewares");

router.get("/", protectRoute, profile.getProfileDetails);
router.get("/:userId", protectRoute, profile.getProfileDetails);

module.exports = router;
