const db = require('../db/knex');

// Start a new chat conversation
exports.startConversation = async (req, res) => {
  try {
    const { guest_name, guest_email } = req.body;
    const customer_id = req.user ? req.user.id : null;

    const [conversation] = await db('chat_conversations')
      .insert({
        customer_id,
        guest_name,
        guest_email,
        status: 'waiting',
        started_at: db.fn.now()
      })
      .returning('*');
    const io = require('../socket').getIO();
    io.emit('new_conversation_waiting', conversation);

    res.status(201).json({ 
      success: true, 
      data: conversation 
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all waiting conversations (for agents)
exports.getWaitingConversations = async (req, res) => {
  try {
    const conversations = await db('chat_conversations')
      .where('status', 'waiting')
      .orderBy('started_at', 'asc');

    res.json({ 
      success: true, 
      data: conversations 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get agent's active conversations
exports.getAgentConversations = async (req, res) => {
  try {
    const agent_id = req.user.id;

    const conversations = await db('chat_conversations')
      .where('agent_id', agent_id)
      .where('status', 'active')
      .orderBy('started_at', 'desc');

    res.json({ 
      success: true, 
      data: conversations 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Agent claims a conversation
exports.claimConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const agent_id = req.user.id;

    const [conversation] = await db('chat_conversations')
      .where({ id, status: 'waiting' })
      .update({
        agent_id,
        status: 'active',
        updated_at: db.fn.now()
      })
      .returning('*');

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found or already claimed' 
      });
    }

    res.json({ 
      success: true, 
      data: conversation 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get messages for a conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const messages = await db('chat_messages')
      .where('conversation_id', id)
      .orderBy('created_at', 'asc');

    // Get attachments for each message
    for (let message of messages) {
      message.attachments = await db('chat_attachments')
        .where('message_id', message.id);
    }

    res.json({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send message to conversation
exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id, message, sender_type } = req.body;
    const sender_id = req.user ? req.user.id : null;

    const [newMessage] = await db('chat_messages')
      .insert({
        conversation_id,
        sender_id,
        sender_type,
        message,
        is_read: false
      })
      .returning('*');

    // Load attachments if any
    const attachments = await db('chat_attachments')
      .where('message_id', newMessage.id);

    // Socket.io broadcast
    const io = require('../socket').getIO();
    io.to(`conversation_${conversation_id}`).emit('new_message', { ...newMessage, attachments });

    res.json({
      success: true,
      data: { ...newMessage, attachments }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Close conversation
exports.closeConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const [conversation] = await db('chat_conversations')
      .where('id', id)
      .update({
        status: 'closed',
        closed_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found' 
      });
    }

    res.json({ 
      success: true, 
      data: conversation 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single conversation
exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await db('chat_conversations')
      .where('id', id)
      .first();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
      error: error.message
    });
  }
};

// Send message with attachments
exports.sendMessageWithAttachments = async (req, res) => {
  try {
    const { conversation_id, message, sender_type } = req.body;
    const sender_id = req.user ? req.user.id : null;
    const files = req.files || [];

    // Save message to database
    const [newMessage] = await db('chat_messages')
      .insert({
        conversation_id,
        sender_id,
        sender_type,
        message: message || '',
        is_read: false
      })
      .returning('*');

    // Save attachments if any
    const attachments = [];
    for (const file of files) {
      const [attachment] = await db('chat_attachments')
        .insert({
          message_id: newMessage.id,
          file_name: file.originalname,
          file_url: `/uploads/chat-attachments/${file.filename}`,
          file_type: file.mimetype,
          file_size: file.size
        })
        .returning('*');
      
      attachments.push(attachment);
    }

    // Broadcast via Socket.io
    const io = require('../socket').getIO();
    io.to(`conversation_${conversation_id}`).emit('new_message', { 
      ...newMessage, 
      attachments 
    });

    res.json({
      success: true,
      data: { ...newMessage, attachments }
    });
  } catch (error) {
    console.error('Error sending message with attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get customer details for chat (orders, delivery status, wishlist)
exports.getCustomerDetails = async (req, res) => {
  try {
    const { customer_id } = req.params;

    // Get customer basic info
    const customer = await db('users')
      .where('id', customer_id)
      .first();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer orders
    const orders = await db('orders')
      .where('user_id', customer_id)
      .orderBy('created_at', 'desc')
      .limit(10);

    // Get order items with product details
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db('order_items')
          .join('products', 'order_items.product_id', 'products.id')
          .where('order_items.order_id', order.id)
          .select(
            'order_items.*',
            'products.name as product_name',  // ✅ DÜZELT
            'products.image_url'
          );

        return {
          ...order,
          items
        };
      })
    );

    // Get wishlist items
    
    const wishlist = await db('wishlists')  
        .join('products', 'wishlists.product_id', 'products.id')
        .where('wishlists.user_id', customer_id)
        .select(
            'wishlists.*',
            'products.name as product_name',
            'products.price',
            'products.image_url'
        );

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          home_address: customer.home_address
        },
        orders: ordersWithItems,
        wishlist
      }
    });
  } catch (error) {
    console.error('Error getting customer details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer details',
      error: error.message
    });
  }
};