// backend/src/controllers/order.controller.js
// Creates an order from the current user's cart using the DB schema in init_schema.
// Uses a single transaction to: create order, insert order_items, decrement stock, clear cart.

const knex = require("../db/knex");

exports.createOrder = async (req, res) => {
  const userId = req.body.userId;
  const address = req.body.address || "";

  try {
    // 1) Find cart for the user
    const cart = await knex("carts").where({ user_id: userId }).first();
    if (!cart) {
      // No cart at all → treat as empty
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // 2) Load cart items joined with product prices
    const cartItems = await knex("cart_items as ci")
      .join("products as p", "ci.product_id", "p.id")
      .where("ci.cart_id", cart.id)
      .select(
        "ci.product_id",
        "ci.quantity",
        // Some adapters return numeric as string; cast for consistency
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

    // 4) Transaction: create order → add items → decrement stock → clear cart
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
        price: ci.price, // column is 'price' in migration
      }));
      await trx("order_items").insert(items);

      // 4.3) Decrement stock on products (column is quantity_in_stock)
      for (const ci of cartItems) {
        await trx("products")
          .where({ id: ci.product_id })
          .decrement("quantity_in_stock", ci.quantity);
      }

      // 4.4) Clear cart items
      await trx("cart_items").where({ cart_id: cart.id }).del();

      return order;
    });

    // 5) Respond with newly created order
    return res.status(201).json({ success: true, data: createdOrder });
  } catch (err) {
    console.error("[createOrder] error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
