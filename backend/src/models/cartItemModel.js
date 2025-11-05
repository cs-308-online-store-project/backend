const pool = require('../config/db');

const CartItemModel = {
  async addItem(cartId, productId, quantity) {
    const res = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [cartId, productId, quantity]
    );
    return res.rows[0];
  },

  async updateItemQuantity(itemId, quantity) {
    const res = await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *`,
      [quantity, itemId]
    );
    return res.rows[0];
  },

  async removeItem(itemId) {
    await pool.query(`DELETE FROM cart_items WHERE id = $1`, [itemId]);
    return { message: 'Item removed' };
  },
};

module.exports = CartItemModel;
