// backend/src/routes/orderRoutes.js
// Exposes order endpoints. Currently only POST /api/orders to create an order.

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");

// Create order from user's cart
router.post("/", orderController.createOrder);

module.exports = router;
