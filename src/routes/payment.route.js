const { payment } = require("../controllers");
const router = require("express").Router();
const { protectRoute, roles } = require("../middlewares");

router.get("/", protectRoute, roles(["SUPER ADMIN"]), payment.getPayments);

module.exports = router;
