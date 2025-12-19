// Socket.IO service to emit events from controllers
let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  if (!ioInstance) {
    console.warn('⚠️ Socket.IO instance not initialized. Events will not be emitted.');
  }
  return ioInstance;
};

module.exports = {
  setIO,
  getIO
};

