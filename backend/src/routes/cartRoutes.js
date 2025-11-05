const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.post('/cart/add', cartController.addToCart);
router.get('/cart/:userId', cartController.getCart);
router.put('/cart/items/:id', cartController.updateQuantity);
router.delete('/cart/items/:id', cartController.removeItem);

module.exports = router;
