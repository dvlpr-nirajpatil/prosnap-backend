const auth = require("./auth.controller");
const order = require("./order.controller");
const payment = require("./payment.controller");
const user = require("../controllers/user.controller");
const verification = require("../controllers/verification.controller");

module.exports = { auth, order, payment, user, verification };
