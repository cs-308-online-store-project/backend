const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { requireAuth } = require('../middleware/auth');

// Generate and email invoice
router.post('/:orderId/generate', requireAuth, invoiceController.generateAndEmailInvoice);

module.exports = router;