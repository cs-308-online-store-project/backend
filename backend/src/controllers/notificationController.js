const NotificationModel = require('../models/notificationModel');

exports.listMine = async (req, res) => {
  const userId = req.user.id;
  const items = await NotificationModel.listByUser(userId);
  res.json({ success: true, items });
};

exports.unreadCount = async (req, res) => {
  const userId = req.user.id;
  const count = await NotificationModel.unreadCount(userId);
  res.json({ success: true, count });
};

exports.markRead = async (req, res) => {
  const userId = req.user.id;
  const id = Number(req.params.id);
  const updated = await NotificationModel.markRead(userId, id);
  res.json({ success: true, updated });
};

exports.markAllRead = async (req, res) => {
  const userId = req.user.id;
  const updated = await NotificationModel.markAllRead(userId);
  res.json({ success: true, updated });
};
