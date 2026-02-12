const { order } = require("../controllers");
const router = require("express").Router();
const { protectRoute, roles } = require("../middlewares");

router.get("/", protectRoute, roles(["SUPER ADMIN"]), order.getOrders);

module.exports = router;
