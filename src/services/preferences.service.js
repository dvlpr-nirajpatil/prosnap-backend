const UserPreferences = require("../models/preferences.model");

async function getOrCreatePreferences(user) {
  let prefs = await UserPreferences.findOne({ userId: user._id });

  if (!prefs) {
    prefs = await UserPreferences.create({
      userId: user._id,
      ageRange: {
        min: user.partnerExpectations?.age?.min || 18,
        max: user.partnerExpectations?.age?.max || 60,
      },
    });
  }

  return prefs;
}

module.exports = { getOrCreatePreferences };
