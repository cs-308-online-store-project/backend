const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get(
  "/",
  requireAuth,
  requireRole("sales_manager", "product_manager"),
  orderController.getAllOrders
);

module.exports = router;