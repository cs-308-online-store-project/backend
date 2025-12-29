const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(requireAuth);

router.get('/', notificationController.listMine);              // list
router.get('/unread-count', notificationController.unreadCount);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

module.exports = router;