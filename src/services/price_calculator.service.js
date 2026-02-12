/**
 * Calculate final payable amount for a membership
 * @param {Object} membership - Membership mongoose document or plain object
 * @returns {Object} priceBreakdown
 */
function calculateMembershipPricing(membership) {
  if (!membership || !membership.price) {
    throw new Error("Invalid membership data");
  }

  const mrp = Number(membership.price.mrp);

  // -----------------------------
  // DISCOUNT
  // -----------------------------
  const discountType = membership.price.discount?.type || "percentage";
  const discountValue = membership.price.discount?.value || 0;

  let discountAmount = 0;
  let discountPercentage = 0;

  if (discountType === "percentage") {
    discountPercentage = discountValue;
    discountAmount = (mrp * discountValue) / 100;
  } else if (discountType === "flat") {
    discountAmount = discountValue;
    discountPercentage = (discountAmount / mrp) * 100;
  }

  discountAmount = round(discountAmount);

  const priceAfterDiscount = mrp - discountAmount;

  // -----------------------------
  // GST
  // -----------------------------
  const gstEnabled = membership.price.gst?.enabled ?? true;
  const gstPercentage = gstEnabled ? membership.price.gst?.percentage || 18 : 0;

  const gstAmount = gstEnabled
    ? round((priceAfterDiscount * gstPercentage) / 100)
    : 0;

  // -----------------------------
  // TOTAL PAYABLE
  // -----------------------------
  const totalPayable = round(priceAfterDiscount + gstAmount);

  // -----------------------------
  // RETURN STRUCTURE
  // -----------------------------
  return {
    mrp,

    discount: {
      type: discountType,
      percentage: round(discountPercentage),
      amount: discountAmount,
    },

    gst: {
      enabled: gstEnabled,
      percentage: gstPercentage,
      amount: gstAmount,
    },

    totalPayable,
  };
}

// Utility: round to 2 decimals
function round(value) {
  return Math.round(value * 100) / 100;
}

module.exports = calculateMembershipPricing;
