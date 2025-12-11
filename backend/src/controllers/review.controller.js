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
    const review = await Review.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
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