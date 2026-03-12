const Message = require("../models/message.model");
const logger = require("../core/logger");
const socketService = require("./socket.service");

function formatOpponent(opponent) {
  if (!opponent) return null;

  return {
    _id: opponent._id,
    userName: opponent.userName,
    name: opponent.name,
    profilePicture: opponent.profilePicture,
    isVerified: opponent.isVerified,
  };
}

async function getUnseenMessagesCount(conversationId, userId) {
  try {
    return await Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: userId },
      status: "unseen",
      deleted: false,
    });
  } catch (e) {
    logger.error("GET UNSEEN MESSAGES COUNT ERROR:", e);
    throw e;
  }
}

function buildConversationListItem({
  conversation,
  currentUserId,
  unseenMessageCount,
}) {
  const opponent = conversation.participants.find(
    (participant) => participant._id.toString() !== currentUserId.toString(),
  );

  const payload = {
    _id: conversation._id,
    opponent: formatOpponent(opponent),
    lastMessage: conversation.lastMessage,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };

  if (typeof unseenMessageCount === "number") {
    payload.unseenMessageCount = unseenMessageCount;
  }

  return payload;
}

async function emitConversationUpdated({
  conversation,
  senderId,
  receiverId,
  senderUnseenMessageCount = 0,
}) {
  try {
    const receiverUnseenMessageCount = await getUnseenMessagesCount(
      conversation._id,
      receiverId,
    );

    await Promise.all([
      socketService.sendToUser({
        userId: senderId,
        event: "conversation-updated",
        data: buildConversationListItem({
          conversation,
          currentUserId: senderId,
          unseenMessageCount: senderUnseenMessageCount,
        }),
      }),
      socketService.sendToUser({
        userId: receiverId,
        event: "conversation-updated",
        data: buildConversationListItem({
          conversation,
          currentUserId: receiverId,
          unseenMessageCount: receiverUnseenMessageCount,
        }),
      }),
    ]);
  } catch (e) {
    logger.error("EMIT CONVERSATION UPDATED ERROR", e);
    throw e;
  }
}

module.exports = {
  buildConversationListItem,
  emitConversationUpdated,
  getUnseenMessagesCount,
};
