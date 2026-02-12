const { Payment } = require("../models");
const { response, logger } = require("../core");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET PAYMENTS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.getPayments = async (req, res) => {
  try {
    // Pagination
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page <= 0) page = 1;
    if (isNaN(limit) || limit <= 0 || limit > 100) limit = 10;

    // Fetch payments
    const payments = await Payment.find()
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Total count for pagination
    const total = await Payment.countDocuments();
    const totalPages = Math.ceil(total / limit);

    return response(res, 200, "PAYMENTS FETCHED SUCCESSFULLY!", {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (e) {
    logger.error("GET PAYMENTS API", e);
    return response(res, 500, "INTERNAL SERVER ERROR!");
  }
};
