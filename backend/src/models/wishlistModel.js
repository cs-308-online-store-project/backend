const knex = require('../db/knex');

class WishlistModel {
  // Kullanıcının wishlist'ini ürünlerle getir
  static async getByUserId(userId) {
    return knex('wishlist_items as wi')
      .join('wishlists as w', 'wi.wishlist_id', 'w.id')
      .join('products as p', 'wi.product_id', 'p.id')
      .where('w.user_id', userId)
      .select(
        'wi.id as wishlist_item_id',
        'wi.product_id',
        'p.*'
      )
      .orderBy('wi.id', 'desc');
  }

  // Wishlist yoksa oluştur
  static async ensureWishlist(userId) {
    let wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    if (!wishlist) {
      const inserted = await knex('wishlists')
        .insert({ user_id: userId })
        .returning('id');

      const id = Array.isArray(inserted) ? inserted[0] : inserted;
      wishlist = { id: typeof id === 'object' ? id.id : id };
    }

    return wishlist;
  }

  // Ürün ekle (idempotent)
  static async add(userId, productId) {
    const wishlist = await this.ensureWishlist(userId);

    const exists = await knex('wishlist_items')
      .where({
        wishlist_id: wishlist.id,
        product_id: productId
      })
      .first();

    if (exists) {
      return { created: false };
    }

    await knex('wishlist_items').insert({
      wishlist_id: wishlist.id,
      product_id: productId
    });

    return { created: true };
  }

  // Ürün çıkar (idempotent)
  static async remove(userId, productId) {
    const wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    if (!wishlist) return { deleted: 0 };

    const deleted = await knex('wishlist_items')
      .where({
        wishlist_id: wishlist.id,
        product_id: productId
      })
      .del();

    return { deleted };
  }

  // Navbar wishlist count
  static async getCount(userId) {
    const wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    if (!wishlist) return 0;

    const row = await knex('wishlist_items')
      .where({ wishlist_id: wishlist.id })
      .count({ count: 'id' })
      .first();

    return Number(row?.count ?? 0);
  }

  // SCRUM-92: Bu ürünü wishleyen user'ları getir
  static async getUserIdsWithProduct(productId) {
    const rows = await knex('wishlist_items as wi')
      .join('wishlists as w', 'wi.wishlist_id', 'w.id')
      .where('wi.product_id', productId)
      .distinct('w.user_id as user_id');

    return rows.map(r => r.user_id);
  }
}

module.exports = WishlistModel;