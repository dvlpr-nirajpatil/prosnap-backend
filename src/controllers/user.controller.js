const { User, Highlight } = require("../models");
const { response, logger, utils } = require("../core");
const { notificationService } = require("../services");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET USERS FOR VERIFICATION (NEW PAGINATION FORMAT)
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.getUserForVerifcation = async (req, res) => {
  try {
    // Pagination
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page <= 0) page = 1;
    if (isNaN(limit) || limit <= 0 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    // Query filter
    const filter = {
      "profileStatus.verification": false,
      "profileStatus.registration": true,
      "profileStatus.deleted": false,
    };

    const [users, total] = await Promise.all([
      User.find(filter, {
        "basicDetails.firstName": 1,
        "basicDetails.lastName": 1,
        "basicDetails.gender": 1,
        profilePicture: 1,
        createdAt: 1,
      })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const formattedUsers = users.map((e) => ({
      id: e._id,
      profilePic: e.profilePicture || utils.getProfilePicture(e),
      name: `${e.basicDetails?.firstName || ""} ${e.basicDetails?.lastName || ""}`.trim(),
      createdAt: e.createdAt,
    }));

    return response(res, 200, "PROFILES FOR VERIFICATION FETCHED!", {
      page,
      limit,
      available: total,
      next: skip + users.length < total,
      users: formattedUsers,
    });
  } catch (e) {
    logger.error("GET USER FOR VERIFICATION API", e);
    return response(res, 500, "INTERNAL SERVER ERROR!");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET USERS FOR INFO VERIFICATION (NEW PAGINATION FORMAT)
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.getUserForInfoVerifcation = async (req, res) => {
  try {
    // Pagination
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page <= 0) page = 1;
    if (isNaN(limit) || limit <= 0 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    // Query filter
    const filter = {
      "profileStatus.verification": true,
      "profileStatus.registration": true,
      "profileStatus.infoVerification": true,
      "profileStatus.deleted": false,
    };

    const [users, total] = await Promise.all([
      User.find(filter, {
        "basicDetails.firstName": 1,
        "basicDetails.lastName": 1,
        "basicDetails.gender": 1,
        profilePicture: 1,
        createdAt: 1,
      })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const formattedUsers = users.map((e) => ({
      id: e._id,
      profilePic: e.profilePicture || utils.getProfilePicture(e),
      name: `${e.basicDetails?.firstName || ""} ${e.basicDetails?.lastName || ""}`.trim(),
      createdAt: e.createdAt,
    }));

    return response(res, 200, "PROFILES FOR VERIFICATION FETCHED!", {
      page,
      limit,
      available: total,
      next: skip + users.length < total,
      users: formattedUsers,
    });
  } catch (e) {
    logger.error("GET USER FOR VERIFICATION API", e);
    return response(res, 500, "INTERNAL SERVER ERROR!");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// VERIFY PROFILE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.verifyProfile = async (req, res) => {
  try {
    const { userId, rating } = req.body;
    const highlight = req.query.highlight === "true"; // ✅ FIX

    // Validation
    if (!userId) return response(res, 400, "userId is required");

    if (typeof rating !== "number" || rating < 0 || rating > 6)
      return response(res, 400, "rating must be a number between 0 and 6");

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profileStatus.verification": true,
          rating: rating,
          verificationDetails: {
            verifiedOn: new Date(),
            verifiedBy: req.user.id,
          },
        },
      },
      { new: true },
    );

    if (!user) {
      return response(res, 404, "User not found");
    }

    // Highlight logic
    if (highlight && user.profilePicture) {
      const alreadyHighlighted = await Highlight.findOne({ user: user._id });

      if (!alreadyHighlighted) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 2); // ✅ FIX (2 days)

        const newHighlight = new Highlight({
          user: user._id,
          profilePicture: user.profilePicture,
          expiry: expiryDate,
          gender: user.basicDetails.gender,
          rating: user.rating,
        });

        await newHighlight.save();
      }
    }

    await notificationService.sendToUserId({
      userId,
      title: "✅ Profile Verified",
      body: "Great news! Your profile has been successfully verified. You can now explore more matches and get better visibility.",
    });

    return response(
      res,
      200,
      highlight
        ? "Profiles Verfied and Highlighted Successfully"
        : "Profile Verified!",
      user,
    );
  } catch (e) {
    logger.error("VERIFY PROFILE API", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// REJECT PROFILE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.rejectProfile = async (req, res) => {
  try {
    const { reason, userId } = req.body;

    if (!reason || !userId)
      return response(res, 400, "reason and userId is required !");

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profileStatus.registration": false,
          "profileStatus.verification": false,
          registrationError: {
            error: true,
            issue: reason,
          },
        },
      },
      { new: true },
    );

    await notificationService.sendToUserId({
      userId,
      title: "✅ Profile Verified",
      body: "Great news! Your profile has been successfully verified. You can now explore more matches and get better visibility.",
    });

    return response(res, 200, "Profile Rejected !", user);
  } catch (e) {
    logger.error("REJECT PROFILE API", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET PROFILE DETAILS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.getProfileDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      return response(res, 400, "No User Found !");
    }

    return response(res, 200, "User Details Get Successfully !", user);
  } catch (e) {
    logger.error("GET PROFILE DETAILS API", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET PROFILES WITH PAGINATION & SEARCH
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.getProfiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = {
      "profileStatus.verification": true,
      "profileStatus.deleted": false,
    };

    // 🔍 SEARCH LOGIC
    if (search) {
      filter.$or = [
        { "basicDetails.firstName": { $regex: search, $options: "i" } },
        { "basicDetails.lastName": { $regex: search, $options: "i" } },
        { "auth.number": { $regex: search, $options: "i" } },
        { userId: { $regex: search, $options: "i" } },
      ];
    }

    const [profiles, total] = await Promise.all([
      User.find(filter)
        .select({
          "basicDetails.firstName": 1,
          "basicDetails.lastName": 1,
          "basicDetails.gender": 1,
          profilePicture: 1,
          "socialStatus.maritalStatus": 1,
          "profileStatus.verification": 1,
          "membership.status": 1,
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),

      User.countDocuments(filter),
    ]);

    const formattedProfiles = profiles.map((u) => ({
      id: u._id,
      fullName:
        `${u.basicDetails?.firstName || ""} ${u.basicDetails?.lastName || ""}`.trim(),
      profilePicture: u.profilePicture || utils.getProfilePicture(u),
      maritalStatus: u.socialStatus?.maritalStatus || null,
      profileVerified: u.profileStatus?.verification || false,
      isMember: u.membership?.status || false,
    }));

    return response(res, 200, "Profiles fetched successfully!", {
      page,
      limit,
      available: total,
      next: skip + profiles.length < total,
      profiles: formattedProfiles,
    });
  } catch (e) {
    logger.error("GET PROFILES PAGINATION SEARCH API", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET USER COLLECTION STATS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.getUserStats = async (req, res) => {
  try {
    const now = new Date();

    // TODAY (00:00)
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // WEEK (Monday 00:00)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday = 0
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek,
    );
    startOfWeek.setHours(0, 0, 0, 0);

    // MONTH (1st day 00:00)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const baseFilter = {
      "profileStatus.deleted": false,
    };

    const [totalUsers, addedToday, addedThisWeek, addedThisMonth] =
      await Promise.all([
        User.countDocuments(baseFilter),

        User.countDocuments({
          ...baseFilter,
          createdAt: { $gte: startOfToday },
        }),

        User.countDocuments({
          ...baseFilter,
          createdAt: { $gte: startOfWeek },
        }),

        User.countDocuments({
          ...baseFilter,
          createdAt: { $gte: startOfMonth },
        }),
      ]);

    return response(res, 200, "User stats fetched successfully!", {
      totalUsers,
      addedToday,
      addedThisWeek,
      addedThisMonth,
    });
  } catch (e) {
    logger.error("GET USER STATS API", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// VERIFY USER INFO API
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.verifyUserInformation = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(userId, {
      $set: {
        "profileStatus.infoVerification": false,
      },
    });

    await notificationService.sendToUserId({
      userId,
      title: "🎉 Profile Approved",
      body: "Your updated profile has been reviewed by our team and is now verified. You’re all set to connect with matches!",
    });

    return response(
      res,
      200,
      "Profile Information Successfully Verified !",
      user,
    );
  } catch (e) {
    logger.error("VERIFY USER INFORMATION", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// UPDATE USER PROFILE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const payload = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: payload,
      },
      {
        new: true,
      },
    );

    return response(res, 200, "USER DETAILS UPDATED SUCCESSFULLY !", user);
  } catch (e) {
    logger.error("UPDATE USER PROFILE", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
