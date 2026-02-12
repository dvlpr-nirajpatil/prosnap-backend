const controller = require("../controllers/registration.controller");
const { protectRoute } = require("../middlewares");
const router = require("express").Router();

router.patch("/profile", protectRoute, controller.saveDetails);

module.exports = router;
