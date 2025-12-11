const CartModel = require('../models/cartModel');
const CartItemModel = require('../models/cartItemModel');
const knex = require('../db/knex');

const parseQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const ensureOwnership = (resourceUserId, reqUserId) => {
  if (!resourceUserId || !reqUserId) {
    return false;
  }
  return Number(resourceUserId) === Number(reqUserId);
};

exports.getCart = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const cart = await CartModel.getUserCart(userId);
    const items = cart.map((item) => ({
      id: item.item_id,
      productId: item.product_id,
      name: item.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.price),
      totalPrice: Number(item.price) * Number(item.quantity),
    }));

    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    res.json({ items, total_price: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addToCart = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { productId, quantity } = req.body || {};
  const parsedQuantity = parseQuantity(quantity);
  if (!productId || !parsedQuantity) {
    return res.status(400).json({
      message: "productId and positive quantity are required",
    });
  }

  try {
    const cart = await CartModel.ensureCart(userId);

    // 1) Ürünü stok bilgisiyle al
    const product = await knex("products")
      .select("id", "stock")
      .where({ id: productId })
      .first();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2) Sepette aynı ürün zaten var mı?
    const existingItem = await knex("cart_items")
      .where({ cart_id: cart.id, product_id: productId })
      .first();

    // Şu an sepetteki toplam miktar
    const currentQty = existingItem ? Number(existingItem.quantity) : 0;

    // Talep edilen yeni total: mevcut + eklemek istediğin
    const requestedTotal = currentQty + parsedQuantity;

    // 3) Stok yeterli mi?
    if (product.stock < requestedTotal) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // 4) Stok yeterliyse item'i ekle/güncelle
    const item = await CartItemModel.addOrUpdateItem(
      cart.id,
      productId,
      parsedQuantity
    );

    const responseItem = {
      id: item.id,
      productId: item.product_id,
      name: item.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.price),
      totalPrice: Number(item.price) * Number(item.quantity),
    };

    return res.status(201).json(responseItem);
  } catch (err) {
    console.error("[addToCart] error:", err);
    return res.status(500).json({ error: err.message });
  }
};


exports.updateQuantity = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { quantity } = req.body || {};
  const parsedQuantity = parseQuantity(quantity);
  if (!parsedQuantity) {
    return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ message: 'Invalid cart item id' });
  }

  try {
    const existing = await CartItemModel.getItemWithCart(itemId);
    if (!existing) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (!ensureOwnership(existing.user_id, userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await CartItemModel.updateItemQuantity(itemId, parsedQuantity);
    const responseItem = {
      id: updated.id,
      productId: updated.product_id,
      name: updated.name,
      quantity: Number(updated.quantity),
      unitPrice: Number(updated.price),
      totalPrice: Number(updated.price) * Number(updated.quantity),
    };

    res.json(responseItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeItem = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ message: 'Invalid cart item id' });
  }

  try {
    const existing = await CartItemModel.getItemWithCart(itemId);
    if (!existing) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (!ensureOwnership(existing.user_id, userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await CartItemModel.removeItem(itemId);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
