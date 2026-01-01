const knex = require('../db/knex');

class OrderItem {
  static async findAll() {
    return knex('order_items').select('*').orderBy('id', 'asc');
  }

  static async findById(id) {
    return knex('order_items').where({ id }).first();
  }

  static async findByOrderId(orderId) {
  return knex('order_items as oi')
    .leftJoin('refund_requests as rr', 'oi.id', 'rr.order_item_id')
    .where('oi.order_id', orderId)
    .select(
      'oi.id',
      'oi.order_id',
      'oi.product_id',
      'oi.quantity',
      'oi.price',
      'rr.status as refund_status' // 🔥 KRİTİK
    )
    .orderBy('oi.id', 'asc');
}


  static async create(data) {
    const [orderItem] = await knex('order_items')
      .insert({
        order_id: data.orderId,
        product_id: data.productId,
        quantity: data.quantity,
        price: data.price,
      })
      .returning('*');

    return orderItem;
  }

  static async createMany(items) {
    return knex('order_items').insert(items);
  }

  static async update(id, data) {
    const [orderItem] = await knex('order_items')
      .where({ id })
      .update({
        order_id: data.orderId,
        product_id: data.productId,
        quantity: data.quantity,
        price: data.price,
      })
      .returning('*');

    return orderItem;
  }

  static async delete(id) {
    return knex('order_items').where({ id }).del();
  }
}

module.exports = OrderItem;