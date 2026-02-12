// models
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const notificationService = require("../services/notification.service");
const User = require("../models/user.model");
const { generateInvoice } = require("../controllers/invoice.controller");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ACTIVATE MEMBERSHIP
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

async function activateMembership({ userId, plan }) {
  try {
    const now = new Date();
    let validTill = new Date(now);

    switch (plan.toLowerCase()) {
      case "silver":
        validTill.setMonth(validTill.getMonth() + 1);
        break;

      case "gold":
        validTill.setMonth(validTill.getMonth() + 6);
        break;

      case "platinum":
        validTill.setFullYear(validTill.getFullYear() + 1);
        break;

      default:
        throw new Error("Invalid membership plan");
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "membership.status": true,
          "membership.plan": plan,
          "membership.validTill": validTill,
          "membership.purchasedAt": now,
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return {
      success: true,
      message: "Membership activated successfully",
      membership: user.membership,
    };
  } catch (error) {
    console.error("ACTIVATE MEMBERSHIP ERROR:", error);
    throw error;
  }
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// RECORD PAYMENT AND MARK ORDER
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

async function recordPaymentAndMarkOrder(
  rpPayment,
  { notification = false } = {}
) {
  const razorpayOrderId = rpPayment?.order_id;

  if (!razorpayOrderId) {
    throw new Error("rpPayment.order_id not found");
  }

  const order = await Order.findOne({ razorpayOrderId });

  if (!order) {
    throw new Error("Order not found for razorpayOrderId: " + razorpayOrderId);
  }

  let paymentDoc;

  try {
    paymentDoc = await Payment.findOneAndUpdate(
      { razorpayPaymentId: rpPayment.id },
      {
        $setOnInsert: {
          order: order._id,
          user: order.user,
          product: order.product,
          razorpayOrderId: rpPayment.order_id,
          amount: rpPayment.amount / 100,
          currency: rpPayment.currency,
          status: rpPayment.status,
          method: rpPayment.method,
          captured: Boolean(rpPayment.captured),
          raw: rpPayment,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (err) {
    if (err.code === 11000) {
      paymentDoc = await Payment.findOne({
        razorpayPaymentId: rpPayment.id,
      });
    } else {
      throw err;
    }
  }

  // -----------------------------
  // MEMBERSHIP + INVOICE
  // -----------------------------
  if (
    rpPayment.status === "captured" &&
    rpPayment?.notes?.type === "membership"
  ) {
    const invoice = await generateInvoice({
      userId: rpPayment.notes.userId,
      membershipId: rpPayment.notes.membershipId,
      paymentId: rpPayment.id,
    });

    paymentDoc = await Payment.findByIdAndUpdate(
      paymentDoc._id,
      {
        $set: {
          invoice: invoice.url,
          invoiceNumber: invoice.number,
          captured: true,
          status: rpPayment.status,
        },
      },
      { new: true }
    );

    await activateMembership({
      userId: rpPayment.notes.userId,
      plan: rpPayment.notes.plan,
    });
  }

  // -----------------------------
  // ORDER STATUS UPDATE
  // -----------------------------
  if (rpPayment.status === "captured") {
    order.status = "success";
    order.isPaid = true;
  } else if (rpPayment.status === "authorized") {
    order.status = "pending";
    order.isPaid = false;
  } else if (rpPayment.status === "failed") {
    order.status = "failed";
    order.isPaid = false;
  }

  order.payment = {
    razorpayPaymentId: rpPayment.id,
    status: rpPayment.status,
  };

  order.paymentRef = paymentDoc._id;

  if (notification) {
    await notificationService.sendToTopic("Admin-Payments", {
      title: "💰 Payment Received",
      body: `₹${order.amount / 100} has been credited.`,
      data: {
        orderId: order._id.toString(),
        paymentId: rpPayment.id,
      },
    });
  }

  await order.save();

  return {
    order,
    payment: paymentDoc,
  };
}

module.exports = { recordPaymentAndMarkOrder };
