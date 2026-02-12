const { logger, response } = require("../core");
const { Order } = require("../models");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET ORDERS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
module.exports.getOrders = async (req, res) => {
  try {
    // Pagination
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page <= 0) page = 1;
    if (isNaN(limit) || limit <= 0 || limit > 100) limit = 10;

    // Fetch orders
    const orders = await Order.find()
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Total count for pagination
    const total = await Order.countDocuments();
    const totalPages = Math.ceil(total / limit);

    return response(res, 200, "ORDERS FETCHED SUCCESSFULLY!", {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (e) {
    logger.error("GET ORDERS API", e);
    return response(res, 500, "INTERNAL SERVER ERROR!");
  }
};
