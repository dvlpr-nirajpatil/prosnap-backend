const { logger, response } = require("../core");
const { Conversation, User } = require("../models");
const mongoose = require("mongoose");

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CREATE CONVERSATION
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.createConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return response(res, 400, "receiverId is required");
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return response(res, 400, "Invalid receiver id");
    }

    if (senderId.toString() === receiverId.toString()) {
      return response(res, 400, "You cannot create conversation with yourself");
    }

    const receiver = await User.findOne({
      _id: receiverId,
      isActive: true,
    }).select("_id");

    if (!receiver) {
      return response(res, 404, "Receiver not found");
    }

    const existingConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
    }).populate("participants", "userName name profilePicture isVerified");

    if (existingConversation) {
      return response(res, 200, "Conversation already exists", {
        conversationId: existingConversation._id,
      });
    }

    const conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });

    return response(res, 201, "Conversation created successfully", {
      conversationId: conversation._id,
    });
  } catch (e) {
    logger.error("CREATE CONVERSATION", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GET CONVERSATIONS
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

module.exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    let { page = 1, limit = 20 } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;

    const query = {
      participants: userId,
      $or: [
        { "lastMessage.text": { $regex: /\S/ } },
        { "lastMessage.image": { $nin: [null, ""] } },
      ],
    };

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("participants", "userName name profilePicture isVerified"),
      Conversation.countDocuments(query),
    ]);

    const formattedConversations = conversations.map((conversation) => {
      const opponent = conversation.participants.find(
        (participant) => participant._id.toString() !== userId.toString(),
      );

      return {
        _id: conversation._id,
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
      };
    });

    return response(res, 200, "Conversations fetched successfully", {
      conversations: formattedConversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    logger.error("GET CONVERSATIONS", e);
    return response(res, 500, "INTERNAL SERVER ERROR !");
  }
};
