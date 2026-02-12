const router = require("express").Router();

router.use("/auth", require("./auth.route"));
router.use("/registration", require("./register.route"));

module.exports = router;
