const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { requireAuth, requireRole } = require("../middleware/auth");

// 🔒 Inline validation (NEW – no new file)
function validateOrderId(req, res, next) {
  const { orderId } = req.params;

  if (!Number.isInteger(Number(orderId))) {
    return res.status(400).json({
      error: "Invalid orderId parameter",
    });
  }

  next();
}

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
  validateOrderId,
  invoiceController.downloadInvoicePdf
);

// Customer endpoints
router.post(
  "/:orderId/generate",
  requireAuth,
  validateOrderId,
  invoiceController.generateAndEmailInvoice
);

// Customer can download their own invoice
router.get(
  "/:orderId/download",
  requireAuth,
  validateOrderId,
  invoiceController.downloadMyInvoice
);

module.exports = router;
