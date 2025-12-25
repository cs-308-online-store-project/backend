const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { requireAuth, requireRole } = require("../middleware/auth");

// Sales manager
router.get(
  "/",
  requireAuth,
  requireRole("sales_manager"),
  invoiceController.listInvoicesByDateRange
);

router.get(
  "/:orderId/pdf",
  requireAuth,
  requireRole("sales_manager"),
  invoiceController.downloadInvoicePdf
);


// Generate and email invoice
router.post('/:orderId/generate', requireAuth, invoiceController.generateAndEmailInvoice);

module.exports = router;