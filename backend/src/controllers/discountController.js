const knex = require('../db/knex');
const WishlistModel = require('../models/wishlistModel');
const NotificationService = require('../services/notificationService');

exports.applyDiscount = async (req, res) => {
  console.log("DISCOUNT_ENDPOINT_HIT", req.params, req.body, "user:", req.user?.id, req.user?.role);
  try {
    const productId = Number(req.params.productId ?? req.params.id);
    const discountRate = Number(req.body?.discountRate);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 90) {
      return res.status(400).json({ message: "Invalid discountRate (0-90)" });
    }

    const product = await knex("products").where({ id: productId }).first();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const originalPrice = Number(product.price);

    // rate 0 => discount'u tamamen kaldır
    if (discountRate === 0) {
      await knex("products")
        .where({ id: productId })
        .update({
          discount_rate: 0,
          discount_active: false,
          discounted_price: null,
          list_price: null,
        });

      return res.status(200).json({
        message: "Discount removed",
        productId,
        productName: product.name,
      });
    }

    const discountedPrice = +(originalPrice * (1 - discountRate / 100)).toFixed(2);

    await knex("products")
      .where({ id: productId })
      .update({
        // ✅ eski fiyatı sakla (UI’da üstü çizili gösterilecek)
        list_price: originalPrice,

        discount_rate: Math.round(discountRate),
        discounted_price: discountedPrice,
        discount_active: true,
      });

    const userIds = await WishlistModel.getUserIdsWithProduct(productId);

    const notifyResult = await NotificationService.notifyDiscount({
      userIds,
      productId,
      productName: product.name,
      discountRate: Math.round(discountRate),
    });

    return res.status(200).json({
      message: "Discount applied and notifications triggered",
      productId,
      productName: product.name,
      discountRate: Math.round(discountRate),
      discountedPrice,
      notifiedUsers: notifyResult.inserted,
      emailedUsers: notifyResult.emailed ?? 0,
    });
  } catch (err) {
    console.error("applyDiscount error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
