const { message } = require("../controllers");
const { protectRoute } = require("../middlewares");
const router = require("express").Router();

router.post("/", protectRoute, message.sendMessage);
router.post("/typing", protectRoute, message.typingIndicator);
router.get("/:conversationId", protectRoute, message.getMessages);
router.get("/:conversationId/details", protectRoute, message.getChatDetails);
router.post("/:conversationId/view", protectRoute, message.viewMessages);

module.exports = router;
