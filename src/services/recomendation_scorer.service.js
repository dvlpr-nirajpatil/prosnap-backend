const { normalizeKey } = require("../core/utils");

function getBestMatchScore(prefMap, rawValue) {
  if (!rawValue || !prefMap) return 0;

  const valueKey = normalizeKey(rawValue);
  if (!valueKey) return 0;

  let maxScore = 0;

  const entries =
    prefMap instanceof Map
      ? Array.from(prefMap.entries())
      : Object.entries(prefMap);

  for (const [prefKey, weight] of entries) {
    if (valueKey.includes(prefKey) || prefKey.includes(valueKey)) {
      if (weight > maxScore) {
        maxScore = weight;
      }
    }
  }

  return maxScore;
}

function calculateScore(profile, prefs) {
  let score = 0;

  score += getBestMatchScore(prefs.education, profile.education);

  score += getBestMatchScore(prefs.occupation, profile.occupation);

  score += getBestMatchScore(prefs.location, profile.location);

  return score;
}

module.exports = { calculateScore };
