// backend/src/routes/orderRoutes.js
// Exposes order endpoints. Currently only POST /api/orders to create an order.

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth");

// Create order from user's cart
router.post("/", orderController.createOrder);

// Retrieve all orders for authenticated user
router.get("/", requireAuth, orderController.getOrders);

// Retrieve a single order by id
router.get("/:id", requireAuth, orderController.getOrderById);

// Update order status
router.put("/:id/status", requireAuth, orderController.updateOrderStatus);

module.exports = router;
