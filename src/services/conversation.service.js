// src/services/conversation.service.js

const Message = require("../models/message.model"); // ensure this path is correct
const logger = require("../core/logger");
const socketService = require("../services/socket.service");

// -----------------------------------------------------------------------------
// GET UNSEEN MESSAGES COUNT FUNCTION
// -----------------------------------------------------------------------------
async function getUnseenMessagesCount(conversationId, userId) {
  try {
    // Count messages that are unseen and not sent by the current user
    const count = await Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: userId },
      status: "unseen",
    });

    return count;
  } catch (e) {
    logger.error("GET UNSEEN MESSAGES COUNT ERROR:", e);
    throw new Error(e);
  }
}

// -----------------------------------------------------------------------------
// SEND CONVERSATION TO USER
// -----------------------------------------------------------------------------
async function sendConversations({ conversation, senderId, receiverId }) {
  try {
    // Make sure participants are populated (defensive)
    // if participants are ObjectIds, populate before using this function.
    // e.g. conversation = await conversation.populate('participants', 'basicDetails.firstName basicDetails.lastName profilePicture');

    // Build sender response (synchronous)
    const senderResponse = () => {
      const opponent = conversation.participants.find(
        (p) => p._id.toString() === receiverId.toString()
      );

      return {
        id: conversation._id,
        name: opponent
          ? `${opponent.basicDetails.firstName} ${opponent.basicDetails.lastName}`
          : "Unknown User",
        profilePicture: opponent?.profilePicture || null,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
        unseenMessageCount: 0,
      };
    };

    // Build receiver response (async because it needs unseen count)
    const receiverResponse = async () => {
      const opponent = conversation.participants.find(
        (p) => p._id.toString() === senderId.toString()
      );

      // call the local function by name (not this.getUnseenMessagesCount)
      const unseenMessageCount = await getUnseenMessagesCount(
        conversation._id,
        receiverId
      );

      return {
        id: conversation._id,
        name: opponent
          ? `${opponent.basicDetails.firstName} ${opponent.basicDetails.lastName}`
          : "Unknown User",
        profilePicture: opponent?.profilePicture || null,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
        unseenMessageCount,
      };
    };

    // Send to sender (immediately)
    await socketService.sendToUser({
      userId: senderId,
      event: "new-conversation",
      data: senderResponse(),
    });

    // Get receiver payload and send
    const receiverData = await receiverResponse();
    await socketService.sendToUser({
      userId: receiverId,
      event: "new-conversation",
      data: receiverData,
    });
  } catch (e) {
    logger.error("SEND CONVERSATION FUNCTION ERROR", e);
    throw e;
  }
}

// Export both functions
module.exports = {
  getUnseenMessagesCount,
  sendConversations,
};
