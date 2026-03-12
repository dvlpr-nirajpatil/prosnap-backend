const { logger, response } = require("../core");
const { Conversation, Message } = require("../models");
const mongoose = require("mongoose");
const socketService = require("../services/socket.service");
const {
  buildConversationListItem,
  emitConversationUpdated,
} = require("../services/conversation.service");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SEND MESSAGE
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, text = "", image = null } = req.body;

    if (!conversationId) {
      return response(res, 400, "conversationId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return response(res, 400, "Invalid conversation id");
    }

    const trimmedText = text ? text.trim() : "";

    if (!trimmedText && !image) {
      return response(res, 400, "Message text or image is required");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text: trimmedText || null,
      image,
    });

    const lastMessagePayload = {
      text: trimmedText || "",
      image: image || null,
      sender: userId,
      createdAt: message.createdAt,
    };

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: lastMessagePayload,
      updatedAt: message.createdAt,
    });

    const receiverId = conversation.participants.find(
      (participantId) => participantId.toString() !== userId.toString(),
    );

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "userName name profilePicture isVerified",
    );

    const populatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "userName name profilePicture isVerified");

    if (receiverId) {
      await emitConversationUpdated({
        conversation: populatedConversation,
        senderId: userId,
        receiverId,
      });
    }

    if (receiverId) {
      await socketService.sendToUser({
        userId: receiverId,
        event: "new-message",
        data: {
          conversationId,
          message: populatedMessage,
        },
      });
    }

    return response(res, 201, "Message sent successfully", {
      message: populatedMessage,
      conversation: buildConversationListItem({
        conversation: populatedConversation,
        currentUserId: userId,
        unseenMessageCount: 0,
      }),
    });
  } catch (e) {
    logger.error("SEND MESSAGE", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET MESSAGES BY CONVERSATION ID
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    let { page = 1, limit = 30 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return response(res, 400, "Invalid conversation id");
    }

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 30;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    const skip = (page - 1) * limit;
    const query = { conversation: conversationId, deleted: false };

    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "userName name profilePicture isVerified"),
      Message.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return response(res, 200, "Messages fetched successfully", {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (e) {
    logger.error("GET MESSAGES", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET CHAT DETAILS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getChatDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return response(res, 400, "Invalid conversation id");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    }).populate("participants", "userName name profilePicture isVerified");

    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    const opponent = conversation.participants.find(
      (participant) => participant._id.toString() !== userId.toString(),
    );

    return response(res, 200, "Chat details fetched successfully", {
      conversationId: conversation._id,
      opponent: opponent
        ? {
            _id: opponent._id,
            userName: opponent.userName,
            name: opponent.name,
            profilePicture: opponent.profilePicture,
            isVerified: opponent.isVerified,
          }
        : null,
      lastMessage: conversation.lastMessage,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (e) {
    logger.error("GET CHAT DETAILS", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// VIEW MESSAGES (MARK AS SEEN)
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.viewMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return response(res, 400, "Invalid conversation id");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    const seenAt = new Date();

    const result = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        status: "unseen",
        deleted: false,
      },
      {
        $set: { status: "seen", updatedAt: seenAt },
      },
    );

    const receiverId = conversation.participants.find(
      (participantId) => participantId.toString() !== userId.toString(),
    );

    if (receiverId) {
      await socketService.sendToUser({
        userId: receiverId,
        event: "messages-seen",
        data: {
          conversationId,
          seenBy: userId,
          seenAt,
          updatedCount: result.modifiedCount,
        },
      });
    }

    return response(res, 200, "Messages marked as seen", {
      conversationId,
      updatedCount: result.modifiedCount,
      seenAt,
    });
  } catch (e) {
    logger.error("VIEW MESSAGES", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// TYPING INDICATOR
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.typingIndicator = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, isTyping } = req.body;

    if (!conversationId) {
      return response(res, 400, "conversationId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return response(res, 400, "Invalid conversation id");
    }

    if (typeof isTyping !== "boolean") {
      return response(res, 400, "isTyping must be a boolean");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }

    const receiverId = conversation.participants.find(
      (participantId) => participantId.toString() !== userId.toString(),
    );

    if (receiverId) {
      await socketService.sendToUser({
        userId: receiverId,
        event: "typing-indicator",
        data: {
          conversationId,
          userId,
          isTyping,
          timestamp: new Date(),
        },
      });
    }

    return response(res, 200, "Typing indicator sent", {
      conversationId,
      isTyping,
    });
  } catch (e) {
    logger.error("TYPING INDICATOR", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
