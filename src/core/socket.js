let io;

function setIoInstance(ioInstance) {
  io = ioInstance;
}

function getIoIntance() {
  if (!io) throw new Error("Socket.io not initialized yet!");
  return io;
}

module.exports = { setIoInstance, getIoIntance };
