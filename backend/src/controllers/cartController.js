const CartModel = require('../models/cartModel');
const CartItemModel = require('../models/cartItemModel');
const pool = require('../config/db');

exports.getCart = async (req, res) => {
  const userId = req.params.userId; // şimdilik parametreyle
  try {
    const cart = await CartModel.getUserCart(userId);
    if (!cart.length) return res.json({ items: [], total_price: 0 });
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.json({ items: cart, total_price: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    // stok kontrolü
    const stockCheck = await pool.query(`SELECT quantity_in_stock FROM products WHERE id = $1`, [productId]);
    if (!stockCheck.rows.length || stockCheck.rows[0].quantity_in_stock < quantity)
      return res.status(400).json({ error: 'Not enough stock' });

    // kullanıcı cart’ı var mı
    const userCart = await CartModel.getUserCart(userId);
    let cartId;
    if (userCart.length === 0) {
      const newCart = await CartModel.createCart(userId);
      cartId = newCart.id;
    } else {
      cartId = userCart[0].cart_id;
    }

    const item = await CartItemModel.addItem(cartId, productId, quantity);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateQuantity = async (req, res) => {
  const { quantity } = req.body;
  const { id } = req.params;
  try {
    const item = await CartItemModel.updateItemQuantity(id, quantity);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeItem = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await CartItemModel.removeItem(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
