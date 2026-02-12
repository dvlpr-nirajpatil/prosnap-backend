const response = require("../core/response");

module.exports.authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Safety check
      if (!req.user || !req.user.role) {
        return response(res, 401, "UNAUTHORIZED ACCESS!");
      }

      // Normalize roles
      const userRole = String(req.user.role).toLowerCase();
      const roles = allowedRoles.map((r) => String(r).toLowerCase());

      // Check permission
      if (!roles.includes(userRole)) {
        return response(res, 403, "ACCESS DENIED!");
      }

      next();
    } catch (error) {
      return response(res, 500, "INTERNAL SERVER ERROR!");
    }
  };
};
