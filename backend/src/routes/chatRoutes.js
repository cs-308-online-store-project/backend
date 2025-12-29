const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const upload = require('../config/upload');

// Public routes (guest or logged-in users)
router.post('/conversations', optionalAuth, chatController.startConversation);

// Customer routes (logged-in users)
router.get('/conversations/:id/messages', optionalAuth, chatController.getConversationMessages);
router.post('/messages', optionalAuth, chatController.sendMessage);  


// Agent routes (support agents only)
router.get('/conversations/waiting', authenticate, chatController.getWaitingConversations);
router.get('/conversations/my-active', authenticate, chatController.getAgentConversations);
router.get('/conversations/:id', authenticate, chatController.getConversation);
router.post('/conversations/:id/claim', authenticate, chatController.claimConversation);
router.post('/conversations/:id/close', authenticate, chatController.closeConversation);
router.get('/customers/:customer_id/details', authenticate, chatController.getCustomerDetails);

router.post('/messages/with-attachments', 
  optionalAuth, 
  upload.array('attachments', 5), // Max 5 files
  chatController.sendMessageWithAttachments
);

// Get customer details (orders, wishlist, delivery status)
router.get('/customers/:customer_id/details', authenticate, chatController.getCustomerDetails);

module.exports = router;