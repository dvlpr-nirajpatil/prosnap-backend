const protectRoute = require("../middlewares/protect_route");
const { authorizeRoles } = require("./authorize_roles");

module.exports = { protectRoute, roles: authorizeRoles };
