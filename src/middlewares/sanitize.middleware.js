// Sanitizes keys that begin with `$` or contain `.`
const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;

  const cleanObj = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (!Object.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];

    // If key has $ or ., it's suspicious — skip or sanitize
    const cleanKey = key.replace(/[$.]/g, "_");

    cleanObj[cleanKey] =
      typeof value === "object" ? sanitizeObject(value) : value;
  }

  return cleanObj;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject({ ...req.query }); // clone to avoid read-only error
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

module.exports = sanitizeRequest;
