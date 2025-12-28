const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const discountController = require('../controllers/discountController');

// Sales Manager only
router.post(
  '/:productId',
  requireAuth,
  requireRole('sales_manager', 'salesManager', 'SALES_MANAGER'),
  discountController.applyDiscount
);

module.exports = router;
