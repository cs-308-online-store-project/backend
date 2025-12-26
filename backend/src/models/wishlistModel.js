const knex = require('../db/knex');

class WishlistModel {

  // Kullanıcının tüm wishlist'ini getir
  static async getByUserId(userId) {
    return await knex('wishlists as w')
      .join('wishlist_items as wi', 'wi.wishlist_id', 'w.id')
      .join('products as p', 'p.id', 'wi.product_id')
      .where('w.user_id', userId)
      .select(
        'w.id as wishlist_id',
        'p.*',
        'w.created_at as added_at'
      );
  }

  // Wishlist'e ürün ekle
  static async add(userId, productId) {
    // 1) Kullanıcının wishlist'i var mı?
    let wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    // Yoksa oluştur
    if (!wishlist) {
      const [newWishlist] = await knex('wishlists')
        .insert({ user_id: userId })
        .returning('*');
      wishlist = newWishlist;
    }

    // 2) Aynı ürün daha önce eklenmiş mi?
    const exists = await knex('wishlist_items')
      .where({
        wishlist_id: wishlist.id,
        product_id: productId
      })
      .first();

    if (exists) {
      throw new Error('Product already in wishlist');
    }

    // 3) Ürünü wishlist_items tablosuna ekle
    await knex('wishlist_items').insert({
      wishlist_id: wishlist.id,
      product_id: productId
    });

    return true;
  }

  // Wishlist'ten ürün çıkar
  static async remove(userId, productId) {
    const wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    if (!wishlist) return 0;

    return await knex('wishlist_items')
      .where({
        wishlist_id: wishlist.id,
        product_id: productId
      })
      .delete();
  }

  // Ürün wishlist'te mi?
  static async isInWishlist(userId, productId) {
    const wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    if (!wishlist) return false;

    const item = await knex('wishlist_items')
      .where({
        wishlist_id: wishlist.id,
        product_id: productId
      })
      .first();

    return !!item;
  }
}

module.exports = WishlistModel;

