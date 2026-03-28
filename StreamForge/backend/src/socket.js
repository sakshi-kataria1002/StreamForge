const { Server } = require('socket.io');
const LiveStream = require('./models/LiveStream.model');

/**
 * Sets up Socket.io on the HTTP server.
 * @param {import('http').Server} server
 */
function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-stream', async (streamId) => {
      if (!streamId) return;
      socket.join(streamId);

      try {
        await LiveStream.findByIdAndUpdate(streamId, { $inc: { viewerCount: 1 } });
      } catch { /* non-critical */ }

      const roomSize = io.sockets.adapter.rooms.get(streamId)?.size ?? 0;
      io.to(streamId).emit('viewer-count', roomSize);
    });

    socket.on('leave-stream', async (streamId) => {
      if (!streamId) return;
      socket.leave(streamId);

      try {
        await LiveStream.findByIdAndUpdate(streamId, { $inc: { viewerCount: -1 } });
      } catch { /* non-critical */ }

      const roomSize = io.sockets.adapter.rooms.get(streamId)?.size ?? 0;
      io.to(streamId).emit('viewer-count', roomSize);
    });

    socket.on('send-message', async ({ streamId, message, username }) => {
      if (!streamId || !message?.trim() || !username) return;

      const trimmed = message.trim().slice(0, 500);
      const chatEntry = { username, message: trimmed, timestamp: new Date() };

      LiveStream.findByIdAndUpdate(streamId, { $push: { chatMessages: chatEntry } }).catch(() => {});
      io.to(streamId).emit('new-message', chatEntry);
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room === socket.id) continue;
        const roomSize = (io.sockets.adapter.rooms.get(room)?.size ?? 1) - 1;
        io.to(room).emit('viewer-count', roomSize);
      }
    });
  });

  return io;
}

module.exports = { setupSocket };
