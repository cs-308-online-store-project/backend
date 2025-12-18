const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// GET /users/profile - Get current user profile
router.get('/profile', userController.getProfile);

// PUT /users/profile - Update user profile
router.put('/profile', userController.updateProfile);

module.exports = router;