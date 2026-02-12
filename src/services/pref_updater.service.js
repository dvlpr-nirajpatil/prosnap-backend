// | Action           | Weight Increment |
// | ---------------- | ---------------- |
// | View profile     | +1               |
// | Shortlist        | +5               |
// | Send request     | +8               |
// | Request accepted | +15              |

const { normalizeKey } = require("../core/utils");
const { deleteCache } = require("../core/redis.cache");

const MAX_WEIGHT = 100;

function bump(map, rawKey, value) {
  const key = normalizeKey(rawKey);
  if (!key || !map) return;

  const current = map.get(key) || 0;
  map.set(key, Math.min(current + value, MAX_WEIGHT));
}

function safeMap(map) {
  // Handle Map, Object, null, undefined
  if (!map) return new Map();
  if (map instanceof Map) return map;
  return new Map(Object.entries(map));
}

async function updatePreferences(prefs, profile, weight = 1) {
  // 🔥 HARD GUARDS
  if (!prefs || !profile) return;

  // 🔥 Ensure Maps exist
  prefs.education = safeMap(prefs.education);
  prefs.occupation = safeMap(prefs.occupation);
  prefs.location = safeMap(prefs.location);
  prefs.income = safeMap(prefs.income);

  // 🔥 Safe profile access
  const education = profile.professionalInfo?.education?.[0];
  const occupation = profile.professionalInfo?.occupation;
  const city = profile.location?.city;

  bump(prefs.education, education, weight);
  bump(prefs.occupation, occupation, weight);
  bump(prefs.location, city, weight);

  // 🔥 Safe meta
  prefs.meta = prefs.meta || {};
  prefs.meta.totalInteractions = (prefs.meta.totalInteractions || 0) + 1;
  prefs.meta.lastUpdated = new Date();

  await prefs.save();
  await deleteCache(`recommendations:${prefs.userId}:v1`);
}

module.exports = { updatePreferences };
