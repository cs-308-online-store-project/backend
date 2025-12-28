const knex = require('../db/knex');
const WishlistModel = require('../models/wishlistModel');
const NotificationService = require('../services/notificationService');

exports.applyDiscount = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const discountRate = Number(req.body?.discountRate);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 90) {
      return res.status(400).json({ message: 'Invalid discountRate (0-90)' });
    }

    const product = await knex('products').where({ id: productId }).first();
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const originalPrice = Number(product.price);
    const discountedPrice = +(originalPrice * (1 - discountRate / 100)).toFixed(2);

    // 1) Discount update
    await knex('products')
      .where({ id: productId })
      .update({
        discount_rate: Math.round(discountRate),
        discounted_price: discountedPrice,
        discount_active: discountRate > 0
      });

    // 2) Find users with product in wishlist
    const userIds = await WishlistModel.getUserIdsWithProduct(productId);

    // 3) Notify (mock in-app)
    const notifyResult = await NotificationService.notifyDiscount({
      userIds,
      productId,
      productName: product.name,
      discountRate: Math.round(discountRate)
    });

    return res.status(200).json({
      message: 'Discount applied and notifications triggered',
      productId,
      productName: product.name,
      discountRate: Math.round(discountRate),
      discountedPrice,
      notifiedUsers: notifyResult.inserted
    });
  } catch (err) {
    console.error('applyDiscount error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};