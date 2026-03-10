const { conversation } = require("../controllers");
const { protectRoute } = require("../middlewares");
const router = require("express").Router();

router.post("/", protectRoute, conversation.createConversation);
router.get("/", protectRoute, conversation.getConversations);

module.exports = router;
