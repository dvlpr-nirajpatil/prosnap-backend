const { response, logger } = require("../core");
const { User } = require("../models");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET USERS FOR VERIFICATION
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getUsersForVerification = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const filter = {
      "profileStatus.registration": true,
      "profileStatus.verification": false,
    };

    // Fetch users with pagination
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // latest first (optional)

    const formattedUsers = users.map((e) => {
      return {
        id: e._id,
        profilePic: e.profilePicture,
        name: `${e.basicDetails.firstName} ${e.basicDetails.lastName}`,
        maritalStatus: e.socialStatus.maritalStatus,
        createdAt: e.createdAt,
      };
    });

    // Total count for pagination info
    const totalUsers = await User.countDocuments(filter);

    return response(res, 200, "PROFILES FOR VERIFY FETCHED SUCCESSFULLY!", {
      users: formattedUsers,
      pagination: {
        totalRecords: totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        pageSize: limit,
      },
    });
  } catch (e) {
    logger.error("GET PROFILES FOR VERIFY", e);
    return response(res, 500, "INTERNAL SERVER ERROR!");
  }
};
