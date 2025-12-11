// src/models/wishlistModel.js
const knex = require("../db/knex");

class WishlistModel {
  static async ensureWishlist(userId) {
    const existing = await knex("wishlists")
      .where({ user_id: userId })
      .first();

    if (existing) return existing;

    const [wishlist] = await knex("wishlists")
      .insert({ user_id: userId })
      .returning("*");

    return wishlist;
  }

  static async getWishlistItems(userId) {
    return knex("wishlist_items as wi")
      .join("wishlists as w", "wi.wishlist_id", "w.id")
      .join("products as p", "wi.product_id", "p.id")
      .select(
        "wi.id",
        "wi.product_id",
        "p.name",
        "p.price",
        "p.stock",
        "p.created_at as product_created_at"
      )
      .where("w.user_id", userId)
      .orderBy("wi.id", "desc");   // 🔥 created_at YOK, id'ye göre sırala
  }

  static async addItem(wishlistId, productId) {
    const [item] = await knex("wishlist_items")
      .insert({ wishlist_id: wishlistId, product_id: productId })
      .returning("*");

    return item;
  }

  static async findItemById(itemId) {
    return knex("wishlist_items as wi")
      .join("wishlists as w", "wi.wishlist_id", "w.id")
      .select("wi.*", "w.user_id")
      .where("wi.id", itemId)
      .first();
  }

  static async removeItem(itemId) {
    return knex("wishlist_items").where({ id: itemId }).del();
  }
}

module.exports = WishlistModel;