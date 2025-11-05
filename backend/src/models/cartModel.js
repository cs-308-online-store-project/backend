const pool = require('../config/db');

const CartModel = {
  async getUserCart(userId) {
    const result = await pool.query(
      `SELECT c.id AS cart_id, ci.id AS item_id, p.id AS product_id, p.name, ci.quantity, p.price
       FROM carts c
       LEFT JOIN cart_items ci ON c.id = ci.cart_id
       LEFT JOIN products p ON ci.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );
    return result.rows;
  },

  async createCart(userId) {
    const res = await pool.query(
      `INSERT INTO carts (user_id) VALUES ($1) RETURNING id`,
      [userId]
    );
    return res.rows[0];
  },
};

module.exports = CartModel;
