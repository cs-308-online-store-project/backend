const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { requireAuth, requireRole } = require("../middleware/auth");

// Sales manager endpoints
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

// Customer endpoints
router.post('/:orderId/generate', requireAuth, invoiceController.generateAndEmailInvoice);

// ✅ NEW: Customer can download their own invoice
router.get('/:orderId/download', requireAuth, invoiceController.downloadMyInvoice);

module.exports = router;