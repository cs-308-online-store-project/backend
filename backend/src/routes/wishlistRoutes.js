const express = require('express');
const router = express.Router();

const wishlistController = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/auth');

// All wishlist routes require auth
router.use(requireAuth);

/**
 * READ
 */
router.get('/', wishlistController.getWishlist);
router.get('/count', wishlistController.getWishlistCount);

/**
 * LEGACY (optional) - keep if frontend currently uses these
 * POST /add with body { productId }
 * DELETE /remove/:productId
 */
router.post('/add', wishlistController.addToWishlist);
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

/**
 * EXISTING "items" style (optional) - keep if you really have move-to-cart etc.
 * If you don't use these endpoints, delete this block.
 */
router.post('/items', wishlistController.addToWishlist);           // (body productId)
router.delete('/items/:id', wishlistController.removeFromWishlist); // (by wishlist item id)
router.post('/items/:id/move-to-cart', wishlistController.moveToCart);

/**
 * JIRA-FRIENDLY (productId in path)
 * IMPORTANT: keep these at the END so they don't catch '/count' etc.
 */
router.post('/:productId', wishlistController.addToWishlistByProduct);
router.delete('/:productId', wishlistController.removeFromWishlistByProduct);

module.exports = router;
