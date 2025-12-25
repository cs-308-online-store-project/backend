const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { requireAuth, requireRole } = require("../middleware/auth");

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes (not auth for now)
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/stock', productController.updateProductStock);
router.delete('/:id', productController.deleteProduct);

// Sales Manager routes
router.put(
  "/:id/price",
  requireAuth,
  requireRole("sales_manager"),
  productController.updatePriceBySalesManager
);

router.put(
  "/:id/discount",
  requireAuth,
  requireRole("sales_manager"),
  productController.applyDiscountBySalesManager
);


module.exports = router;