require("dotenv").config();
const connectDb = require("./src/config/db_config");
const app = require("./src/app");
const logger = require("./src/core/logger");
const http = require("http");
const { Server } = require("socket.io");
const setupSocket = require("./src/sockets/socket");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;

setupSocket(io);

connectDb();

server.listen(PORT, () => {
  logger.info(`🟢 Server is running on port ${PORT}`);
});
