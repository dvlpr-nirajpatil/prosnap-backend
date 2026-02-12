const { user } = require("../controllers");
const router = require("express").Router();
const { protectRoute, roles } = require("../middlewares");

router.get(
  "/verification-pending",
  protectRoute,
  roles(["SUPER ADMIN"]),
  user.getUserForVerifcation,
);
router.get(
  "/info-verification",
  protectRoute,
  roles(["SUPER ADMIN"]),
  user.getUserForInfoVerifcation,
);

router.patch(
  "/verify",
  protectRoute,
  roles(["SUPER ADMIN"]),
  user.verifyProfile,
);
router.patch(
  "/verify/info",
  protectRoute,
  roles(["SUPER ADMIN"]),
  user.verifyUserInformation,
);

router.patch(
  "/reject",
  protectRoute,
  roles(["SUPER ADMIN"]),
  user.rejectProfile,
);
router.get(
  "/details/:id",
  protectRoute,
  roles(["SUPER ADMIN"]),
  user.getProfileDetails,
);

router.patch(
  "/update/:id",
  protectRoute,
  roles(["SUPER ADMIN"]),
  user.updateUserProfile,
);

router.get("/", protectRoute, roles(["SUPER ADMIN"]), user.getProfiles);
router.get("/stats", protectRoute, roles(["SUPER ADMIN"]), user.getUserStats);

module.exports = router;
