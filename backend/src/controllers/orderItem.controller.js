const OrderItem = require('../models/orderItem.model');

const buildResponse = (orderItem) => ({
  id: orderItem.id,
  orderId: orderItem.order_id,
  productId: orderItem.product_id,
  quantity: Number(orderItem.quantity),
  price: Number(orderItem.price),
});

exports.getAllOrderItems = async (req, res) => {
  try {
    const items = await OrderItem.findAll();
    res.json({ success: true, data: items.map(buildResponse) });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrderItemById = async (req, res) => {
  try {
    const item = await OrderItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Order item not found' });
    }

    res.json({ success: true, data: buildResponse(item) });
  } catch (error) {
    console.error('Error fetching order item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrderItemsByOrderId = async (req, res) => {
  try {
    const items = await OrderItem.findByOrderId(req.params.orderId);
    res.json({ success: true, data: items.map(buildResponse) });
  } catch (error) {
    console.error('Error fetching order items by order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createOrderItem = async (req, res) => {
  try {
    const { orderId, productId, quantity, price } = req.body;

    if (!orderId || !productId || quantity === undefined || price === undefined) {
      return res.status(400).json({ success: false, error: 'orderId, productId, quantity and price are required' });
    }

    const created = await OrderItem.create({ orderId, productId, quantity, price });
    res.status(201).json({ success: true, data: buildResponse(created) });
  } catch (error) {
    console.error('Error creating order item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateOrderItem = async (req, res) => {
  try {
    const { orderId, productId, quantity, price } = req.body;

    const updated = await OrderItem.update(req.params.id, { orderId, productId, quantity, price });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Order item not found' });
    }

    res.json({ success: true, data: buildResponse(updated) });
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteOrderItem = async (req, res) => {
  try {
    const deleted = await OrderItem.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Order item not found' });
    }

    res.json({ success: true, message: 'Order item deleted' });
  } catch (error) {
    console.error('Error deleting order item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};