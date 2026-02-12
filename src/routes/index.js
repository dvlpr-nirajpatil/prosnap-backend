const router = require("express").Router();

router.use("/auth", require("./auth.route"));
router.use("/orders", require("./order.route"));
router.use("/payments", require("./payment.route"));
router.use("/users", require("./user.route"));
router.use("/verification", require("./verification.route"));
router.use("/registration", require("./register.route"));

module.exports = router;
