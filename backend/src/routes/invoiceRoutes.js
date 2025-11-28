// backend/src/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { requireAuth } = require('../middleware/auth');

// Generate invoice for an order
router.post('/:orderId/generate', requireAuth, invoiceController.generateInvoice);

// Download invoice PDF
router.get('/:orderId/download', requireAuth, invoiceController.downloadInvoice);

module.exports = router;