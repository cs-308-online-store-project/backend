const Review = require('../models/review.model');

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getReviewsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const { approvedOnly = 'false' } = req.query;
    const reviews = await Review.findByProductId(productId, { approvedOnly: approvedOnly === 'true' });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, comment, order_id, user_id } = req.body;
    
    // 1. KONTROL: Gerekli alanlar
    if (!product_id || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product ID and User ID are required' 
      });
    }
    
    // 2. KONTROL: Order delivered mi?
    if (order_id) {
      const knex = require('../db/knex');
      const order = await knex('orders')
        .where({ id: order_id, user_id: user_id })
        .first();
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
      }
      
      if (order.status !== 'delivered') {
        return res.status(400).json({ 
          success: false, 
          error: 'You can only review delivered products' 
        });
      }
      
      const orderItem = await knex('order_items')
        .where({ order_id: order_id, product_id: product_id })
        .first();
        
      if (!orderItem) {
        return res.status(400).json({ 
          success: false, 
          error: 'Product not found in this order' 
        });
      }
    }
    
    // 3. TEK BİR REVIEW OLUŞTUR ✅
    const hasComment = comment && comment.trim();
    const approved = !hasComment; // Comment yoksa otomatik onaylı
    
    const review = await Review.create({
      product_id: product_id,
      user_id: user_id,
      rating: rating || null,
      comment: hasComment ? comment.trim() : null,
      approved: approved,
    });
    
    const message = hasComment
      ? '✅ Rating added! Your comment is pending approval.' 
      : '✅ Rating added!';
    
    res.status(201).json({ 
      success: true, 
      data: review,
      message: message
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.update(req.params.id, req.body);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    await Review.delete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  if (typeof approved !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Invalid approved value. Expected boolean.',
    });
  }

  try {
    const review = await Review.updateStatus(id, approved);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};