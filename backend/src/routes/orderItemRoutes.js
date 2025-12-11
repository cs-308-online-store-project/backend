const express = require('express');
const orderItemController = require('../controllers/orderItem.controller');

const router = express.Router();

router.get('/', orderItemController.getAllOrderItems);
router.get('/order/:orderId', orderItemController.getOrderItemsByOrderId);
router.get('/:id', orderItemController.getOrderItemById);
router.post('/', orderItemController.createOrderItem);
router.put('/:id', orderItemController.updateOrderItem);
router.delete('/:id', orderItemController.deleteOrderItem);

module.exports = router;