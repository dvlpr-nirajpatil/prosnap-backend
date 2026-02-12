const { User } = require("../models");
const { logger, response } = require("../core");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE PROFILE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.saveDetails = async (req, res) => {
  try {
    const { name, userName, bio, gender, dob, profilePicture } = req.body;

    // 🔥 1️⃣ Required fields (except profilePicture)
    const requiredFields = ["name", "userName", "bio", "gender", "dob"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return response(res, 400, "Validation Error", {
        missingFields,
      });
    }

    const normalizedUserName = userName.toLowerCase().trim();

    // 🔥 2️⃣ Username format validation (Instagram-style)
    const usernameRegex = /^[a-z0-9._]{3,30}$/;
    if (!usernameRegex.test(normalizedUserName)) {
      return response(
        res,
        400,
        "Username must be 3-30 characters and contain only lowercase letters, numbers, dot or underscore",
      );
    }

    // 🔥 3️⃣ Parse DOB (dd/mm/yyyy)
    const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!dobRegex.test(dob)) {
      return response(res, 400, "DOB must be in dd/mm/yyyy format");
    }

    const [day, month, year] = dob.split("/");

    const parsedDob = new Date(`${year}-${month}-${day}`);

    if (isNaN(parsedDob.getTime())) {
      return response(res, 400, "Invalid date");
    }

    // 🔥 4️⃣ Age validation (minimum 13 years)
    const today = new Date();
    let age = today.getFullYear() - parsedDob.getFullYear();
    const monthDiff = today.getMonth() - parsedDob.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < parsedDob.getDate())
    ) {
      age--;
    }

    if (age < 13) {
      return response(res, 400, "User must be at least 13 years old");
    }

    // 🔥 5️⃣ Check if profile already completed
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return response(res, 404, "User not found");
    }

    if (currentUser.profileCompleted) {
      return response(res, 400, "Profile already completed");
    }

    // 🔥 6️⃣ Username uniqueness check (exclude current user)
    const existingUser = await User.findOne({
      userName: normalizedUserName,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return response(res, 409, "Username already exists !");
    }

    // 🔥 7️⃣ Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          name: name.trim(),
          userName: normalizedUserName,
          bio: bio.trim(),
          gender,
          dob: parsedDob,
          profilePicture: profilePicture || null,
          registration: true,
        },
      },
      { new: true, runValidators: true },
    ).select(
      "userName name email bio profilePicture gender dob accountType followersCount followingCount postsCount isVerified profileCompleted registration",
    );

    return response(res, 200, "User Details Saved Successfully !", updatedUser);
  } catch (e) {
    logger.error("SAVE DETAILS", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
