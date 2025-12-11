const express = require('express');
const reviewController = require('../controllers/review.controller');

const router = express.Router();

router.get('/', reviewController.getAllReviews);
router.get('/product/:productId', reviewController.getReviewsByProductId);
router.get('/:id', reviewController.getReviewById);
router.post('/', reviewController.createReview);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);
router.put('/:id/status', reviewController.updateStatus);

module.exports = router;