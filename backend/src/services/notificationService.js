const knex = require('../db/knex');

class NotificationService {
  static async notifyDiscount({ userIds, productId, productName, discountRate }) {
    if (!userIds || userIds.length === 0) return { inserted: 0 };

    const title = 'Discount Alert';
    const message = `${productName} is now ${discountRate}% off.`;

    const rows = userIds.map((uid) => ({
      user_id: uid,
      type: 'DISCOUNT',
      title,
      message,
      data: JSON.stringify({ productId, discountRate, productName }),
      is_read: false,
      created_at: knex.fn.now(),
    }));

    await knex('notifications').insert(rows);

    console.log('NOTIFY_DISCOUNT', { productId, discountRate, userCount: userIds.length });
    return { inserted: rows.length };
  }
}

module.exports = NotificationService;
