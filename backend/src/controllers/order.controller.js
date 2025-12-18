// backend/src/controllers/order.controller.js

const knex = require("../db/knex");

const mapOrderRecord = (order, itemsMap) => {
  const items = itemsMap.get(order.id) || [];
  return {
    id: order.id,
    status: order.status,
    totalPrice: order.total_price !== undefined ? Number(order.total_price) : null,
    address: order.address || null,
    createdAt: order.created_at,
    invoice_pdf: order.invoice_pdf || null, 
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      quantity: Number(item.quantity),
      unitPrice: Number(item.price),
      totalPrice: Number(item.price) * Number(item.quantity),
    })),
  };
};

exports.createOrder = async (req, res) => {
  const userId = req.body.userId;
  const address = req.body.address || "";

  try {
    // 1) Find cart for the user
    const cart = await knex("carts").where({ user_id: userId }).first();
    if (!cart) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // 2) Load cart items joined with product prices
    const cartItems = await knex("cart_items as ci")
      .join("products as p", "ci.product_id", "p.id")
      .where("ci.cart_id", cart.id)
      .select(
        "ci.product_id",
        "ci.quantity",
        knex.raw("CAST(p.price AS DECIMAL(10,2)) as price")
      );

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // 3) Compute total price
    const total = cartItems.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.quantity),
      0
    );

    // 4) Transaction
    const createdOrder = await knex.transaction(async (trx) => {
      // 4.1) Create order
      const [order] = await trx("orders")
        .insert({
          user_id: userId,
          total_price: total,
          address,
          status: "processing",
        })
        .returning("*");

      // 4.2) Insert order_items
      const items = cartItems.map((ci) => ({
        order_id: order.id,
        product_id: ci.product_id,
        quantity: ci.quantity,
        price: ci.price,
      }));
      await trx("order_items").insert(items);

      // 4.4) Clear cart
      await trx("cart_items").where({ cart_id: cart.id }).del();

      return order;
    });

    return res.status(201).json({ success: true, data: createdOrder });
  } catch (err) {
    console.error("[createOrder] error:", err);

    if (err.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ success: false, error: "Insufficient stock" });
    }

    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const orders = await knex("orders")
      .where({ user_id: userId })
      .orderBy("created_at", "desc");

    if (orders.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const orderIds = orders.map((order) => order.id);
    const orderItems = await knex("order_items")
      .whereIn("order_id", orderIds)
      .orderBy("id", "asc");

    const itemsMap = orderItems.reduce((acc, item) => {
      if (!acc.has(item.order_id)) {
        acc.set(item.order_id, []);
      }
      acc.get(item.order_id).push(item);
      return acc;
    }, new Map());

    const data = orders.map((order) => mapOrderRecord(order, itemsMap));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getOrders] error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    const order = await knex("orders")
      .where({ user_id: userId, id: orderId })
      .first();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const orderItems = await knex("order_items")
      .where({ order_id: order.id })
      .orderBy("id", "asc");

    const itemsMap = new Map();
    itemsMap.set(order.id, orderItems);

    const data = mapOrderRecord(order, itemsMap);

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getOrderById] error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const ALLOWED_STATUSES = [
  "processing",
  "in_transit",
  "delivered",
  "cancelled",
  "refunded",
];

exports.updateOrderStatus = async (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      message: "Invalid status",
      allowedStatuses: ALLOWED_STATUSES,
    });
  }

  try {
    const updatedRows = await knex("orders")
      .where({ id: orderId })
      .update({ status })
      .returning("*");

    const updatedOrder = updatedRows?.[0];

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    const orderItems = await knex("order_items")
      .where({ order_id: updatedOrder.id })
      .orderBy("id", "asc");

    const itemsMap = new Map();
    itemsMap.set(updatedOrder.id, orderItems);

    return res.json({ success: true, data: mapOrderRecord(updatedOrder, itemsMap) });
  } catch (err) {
    console.error("[updateOrderStatus] error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
// Cancel Order - Only if status is "processing"
exports.cancelOrder = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    // Transaction to ensure atomicity
    const result = await knex.transaction(async (trx) => {
      // 1. Get order and verify ownership
      const order = await trx("orders")
        .where({ id: orderId, user_id: userId })
        .first();

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      // 2. Check if order can be cancelled (only "processing" status)
      if (order.status !== "processing") {
        throw new Error("CANNOT_CANCEL");
      }

      // 3. Get order items
      const orderItems = await trx("order_items")
        .where({ order_id: orderId });

      // 4. Restore stock for each product
      for (const item of orderItems) {
        await trx("products")
          .where({ id: item.product_id })
          .increment("stock", item.quantity);
      }

      // 5. Update order status to "cancelled"
      const [updatedOrder] = await trx("orders")
        .where({ id: orderId })
        .update({ status: "cancelled" })
        .returning("*");

      return { order: updatedOrder, items: orderItems };
    });

    // Map response
    const itemsMap = new Map();
    itemsMap.set(result.order.id, result.items);
    const data = mapOrderRecord(result.order, itemsMap);

    return res.json({ 
      success: true, 
      message: "Order cancelled successfully",
      data 
    });

  } catch (err) {
    console.error("[cancelOrder] error:", err);

    if (err.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ 
        success: false, 
        error: "Order not found" 
      });
    }

    if (err.message === "CANNOT_CANCEL") {
      return res.status(400).json({ 
        success: false, 
        error: "Order can only be cancelled if status is 'processing'" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};