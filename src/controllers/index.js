const auth = require("./auth.controller");
const post = require("./post.controller");
const feed = require("./feed.controller");
const story = require("./story.controller");
const upload = require("./upload.controller");
const conversation = require("./conversation.controller");
const search = require("./search.controller");
const message = require("./message.controller");
const profile = require("./profile.controller");

module.exports = {
  auth,
  post,
  feed,
  story,
  upload,
  conversation,
  search,
  message,
  profile,
};
