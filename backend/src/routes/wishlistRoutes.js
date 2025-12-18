const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/auth');
// Tüm route'lar authentication gerektirir
router.use(requireAuth);

router.get('/', wishlistController.getWishlist);
router.get('/count', wishlistController.getWishlistCount);
router.post('/add', wishlistController.addToWishlist);
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

module.exports = router;