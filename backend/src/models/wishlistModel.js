const knex = require('../db/knex');

class WishlistModel {
<<<<<<< HEAD

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

=======

  // Kullanıcının wishlist'ini ürünlerle getir
static async getByUserId(userId) {
  return knex('wishlist_items as wi')
    .join('wishlists as w', 'wi.wishlist_id', 'w.id')
    .join('products as p', 'wi.product_id', 'p.id')
    .where('w.user_id', userId)
    .select(
      'wi.id as wishlist_item_id',
      'wi.product_id',
      // 'wi.created_at as added_at',  // <-- BUNU SİL (kolon yok)
      'p.*'
    )
    .orderBy('wi.id', 'desc'); // <-- created_at yerine id ile sırala
}


  // Wishlist yoksa oluştur
  static async ensureWishlist(userId) {
    let wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    if (!wishlist) {
      const [id] = await knex('wishlists')
        .insert({ user_id: userId })
        .returning('id');

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

  // Navbar count
  static async getCount(userId) {
    const wishlist = await knex('wishlists')
      .where({ user_id: userId })
      .first();

    if (!wishlist) return 0;

    const row = await knex('wishlist_items')
      .where({ wishlist_id: wishlist.id })
      .count({ count: 'id' })
      .first();

    return Number(row.count || 0);
  }

static async getUserIdsWithProduct(productId) {
  const rows = await knex('wishlist_items as wi')
    .join('wishlists as w', 'wi.wishlist_id', 'w.id')
    .where('wi.product_id', productId)
    .distinct('w.user_id as user_id');

  return rows.map(r => r.user_id);
}

}

module.exports = WishlistModel;
>>>>>>> caf1f36 (SCRUM-92: Trigger wishlist notifications on product discount)
