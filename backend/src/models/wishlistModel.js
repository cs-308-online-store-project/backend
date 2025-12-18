const knex = require('../db/knex');

class WishlistModel {
  // Kullanıcının tüm wishlist'ini getir
  static async getByUserId(userId) {
    return await knex('wishlists')
      .join('products', 'wishlists.product_id', 'products.id')
      .where('wishlists.user_id', userId)
      .select(
        'wishlists.id as wishlist_id',
        'products.*',
        'wishlists.created_at as added_at'
      );
  }

  // Wishlist'e ürün ekle
  static async add(userId, productId) {
    // Önce var mı kontrol et
    const exists = await knex('wishlists')
      .where({ user_id: userId, product_id: productId })
      .first();
    
    if (exists) {
      throw new Error('Product already in wishlist');
    }
    
    const [id] = await knex('wishlists').insert({
      user_id: userId,
      product_id: productId,
    }).returning('id');
    
    return id;
  }

  // Wishlist'ten ürün çıkar
  static async remove(userId, productId) {
    return await knex('wishlists')
      .where({ user_id: userId, product_id: productId })
      .delete();
  }

  // Ürün wishlist'te mi kontrol et
  static async isInWishlist(userId, productId) {
    const item = await knex('wishlists')
      .where({ user_id: userId, product_id: productId })
      .first();
    
    return !!item;
  }

  // Wishlist count (navbar badge için)
  static async getCount(userId) {
    const result = await knex('wishlists')
      .where('user_id', userId)
      .count('id as count')
      .first();
    
    return parseInt(result.count) || 0;
  }
}

module.exports = WishlistModel;