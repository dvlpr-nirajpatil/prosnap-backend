function getTopKeys(prefMap, limit = 2) {
  if (!prefMap) return [];

  const entries =
    prefMap instanceof Map
      ? Array.from(prefMap.entries())
      : Object.entries(prefMap);

  if (!entries.length) return [];

  return entries
    .sort((a, b) => b[1] - a[1]) // highest weight first
    .slice(0, limit)
    .map(([key]) => key);
}

function keysToRegex(keys = []) {
  return keys
    .map((key) => {
      if (!key) return null;
      const pattern = key.replace(/_/g, ".*");
      return new RegExp(pattern, "i");
    })
    .filter(Boolean);
}

module.exports = { getTopKeys, keysToRegex };
