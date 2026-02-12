//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// PLACE HOLDER IMAGES
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const femalePlceholder =
  "https://cdn.reshimgathimarathamatrimony.com/images/696372e5478692182704a42f/08f5a25b-7cce-4eca-b9f9-1412abfec6fe.webp";
const malePlceholder =
  "https://cdn.reshimgathimarathamatrimony.com/images/6947bec7b070600b77bb3cc7/9ec5ffe3-1343-473e-9e36-247a96274651.webp";

module.exports.getProfilePicture = (user) => {
  if (user.profilePicture) return user.profilePicture;

  const gender = user.basicDetails?.gender;

  if (gender === "Male") {
    return malePlceholder;
  }

  if (gender === "Female") {
    return femalePlceholder;
  }

  return malePlceholder;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CALCULATE AGE THROUGH DOB FUNCTION
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
};

module.exports.normalizeKey = (value) => {
  if (!value || typeof value !== "string") return null;

  return value
    .toLowerCase()
    .trim()
    .replace(/\./g, "") // remove dots
    .replace(/\$/g, "") // remove $
    .replace(/\s+/g, "_") // spaces → underscore
    .replace(/[^a-z0-9_]/g, ""); // remove other symbols
};
