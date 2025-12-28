const knex = require('../db/knex');

class NotificationService {
  static async notifyDiscount({ userIds, productId, productName, discountRate }) {
    if (!userIds || userIds.length === 0) return { inserted: 0 };

    const title = 'Discount Alert';
    const message = `${productName} is now ${discountRate}% off!`;

    const rows = userIds.map((uid) => ({
      user_id: uid,
      type: 'DISCOUNT',
      title,
      message,
      data: { productId, discountRate, productName },
      is_read: false,
    }));

    await knex('notifications').insert(rows);

    // mock email/log
    console.log('[DISCOUNT_NOTIFY]', { productId, discountRate, users: userIds.length });

    return { inserted: rows.length };
  }
}

module.exports = NotificationService;