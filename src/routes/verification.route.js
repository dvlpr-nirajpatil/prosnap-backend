const { verification } = require("../controllers");
const { protectRoute, roles } = require("../middlewares");
const router = require("express").Router();

router.get(
  "/profile/unverified",
  protectRoute,
  roles(["SUPER ADMIN"]),
  verification.getUsersForVerification,
);

module.exports = router;
