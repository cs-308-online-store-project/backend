const knex = require('../db/knex');

class NotificationModel {
  static listByUser(userId) {
    return knex('notifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(50);
  }

  static async unreadCount(userId) {
    const row = await knex('notifications')
      .where({ user_id: userId, is_read: false })
      .count({ count: 'id' })
      .first();
    return Number(row.count || 0);
  }

  static markRead(userId, id) {
    return knex('notifications')
      .where({ id, user_id: userId })
      .update({ is_read: true, read_at: knex.fn.now() });
  }

  static markAllRead(userId) {
    return knex('notifications')
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true, read_at: knex.fn.now() });
  }
}

module.exports = NotificationModel;
