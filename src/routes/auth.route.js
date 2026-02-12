const router = require("express").Router();
const { auth } = require("../controllers");
const { protectRoute } = require("../middlewares");

router.post("/sign-in", auth.signIn);
router.post("/sign-up", auth.signUp);
router.post("/refresh-token", auth.refreshToken);
router.get("/sign-out", protectRoute, auth.signOut);
router.get("/sign-out-all", protectRoute, auth.signOutFromAllDevices);
router.get("/me", protectRoute, auth.getCurrentUser);

module.exports = router;
