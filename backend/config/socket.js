const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  // JWT auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || null;
      socket.hostId = decoded.hostId || null;
      socket.role = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.role === 'user' && socket.userId) {
      socket.join(`user_${socket.userId}`);
    } else if (socket.role === 'host' && socket.hostId) {
      socket.join(`host_${socket.hostId}`);
    }

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, text }) => {
      if (!conversationId || !text?.trim()) return;

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isSeeker = socket.role === 'user' && socket.userId && conversation.seeker.toString() === socket.userId;
        const isHost = socket.role === 'host' && socket.hostId && conversation.host.toString() === socket.hostId;
        if (!isSeeker && !isHost) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.role === 'user' ? socket.userId : socket.hostId,
          senderRole: socket.role,
          text: text.trim()
        });

        conversation.lastMessage = text.trim().substring(0, 100);
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        io.to(`conv_${conversationId}`).emit('new_message', {
          _id: message._id,
          conversation: conversationId,
          sender: message.sender,
          senderRole: message.senderRole,
          text: message.text,
          createdAt: message.createdAt
        });

        if (isSeeker) {
          io.to(`host_${conversation.host.toString()}`).emit('conversation_updated', {
            conversationId,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt
          });
        } else {
          io.to(`user_${conversation.seeker.toString()}`).emit('conversation_updated', {
            conversationId,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt
          });
        }
      } catch (err) {
        socket.emit('error_message', { error: err.message });
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', { conversationId, role: socket.role });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('user_stop_typing', { conversationId, role: socket.role });
    });
  });

  return io;
}

module.exports = initSocket;
