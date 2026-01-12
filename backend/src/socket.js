const socketIo = require('socket.io');
const db = require('./db/knex');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:9000'],
      methods: ['GET', 'POST'],
       credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ New client connected:', socket.id);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User joined conversation: ${conversationId}`);
    });

    // Send message
    // Send message
    socket.on('send_message', async (data) => {
    try {
        const { conversation_id, sender_id, sender_type, message } = data;

        console.log('💬 Sending message:', { conversation_id, sender_type, message });

        // Save message to database
        const [newMessage] = await db('chat_messages')
        .insert({
            conversation_id,
            sender_id,
            sender_type,
            message,
            is_read: false
        })
        .returning('*');

        console.log('✅ Message saved:', newMessage);
        console.log('📡 Broadcasting to room:', `conversation_${conversation_id}`);

        // Emit to conversation room
        io.to(`conversation_${conversation_id}`).emit('new_message', newMessage);
        
        console.log('✅ Broadcast complete');
    } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: error.message });
    }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversation_id, user_name } = data;
      socket.to(`conversation_${conversation_id}`).emit('user_typing', { user_name });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      const { conversation_id } = data;
      socket.to(`conversation_${conversation_id}`).emit('user_stop_typing');
    });

    // Agent joins (notify waiting customers)
    socket.on('agent_available', () => {
      socket.join('agents');
      console.log('Agent is now available');
    });

    // New conversation started
    socket.on('new_conversation', (conversation) => {
      io.to('agents').emit('new_conversation_waiting', conversation);
    });

    // Agent claims conversation
    socket.on('claim_conversation', async (data) => {
      try {
        const { conversation_id, agent_id } = data;

        const [conversation] = await db('chat_conversations')
          .where({ id: conversation_id, status: 'waiting' })
          .update({
            agent_id,
            status: 'active',
            updated_at: db.fn.now()
          })
          .returning('*');

        if (conversation) {
          io.to(`conversation_${conversation_id}`).emit('agent_joined', conversation);
          io.to('agents').emit('conversation_claimed', conversation);
        }
      } catch (error) {
        console.error('Error claiming conversation:', error);
      }
    });

    // Mark message as read
    socket.on('mark_as_read', async (data) => {
      try {
        const { message_id } = data;

        await db('chat_messages')
          .where('id', message_id)
          .update({
            is_read: true,
            read_at: db.fn.now()
          });

        socket.emit('message_read', { message_id });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Close conversation
    socket.on('close_conversation', async (data) => {
      try {
        const { conversation_id } = data;

        const [conversation] = await db('chat_conversations')
          .where('id', conversation_id)
          .update({
            status: 'closed',
            closed_at: db.fn.now()
          })
          .returning('*');

        io.to(`conversation_${conversation_id}`).emit('conversation_closed', conversation);
      } catch (error) {
        console.error('Error closing conversation:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initializeSocket, getIO };