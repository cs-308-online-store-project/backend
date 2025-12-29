const Product = require('../models/product.model');

// GET /api/products?search=shirt&sort=price_asc&category_id=1&page=1&limit=10
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100,
      search = '',
      sort = '',
      category_id = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search.trim(),
      sort,
      category_id: category_id ? parseInt(category_id) : null
    };

    const products = await Product.findAll(options);
    
    res.json({ 
      success: true, 
      data: products,
      count: products.length,
      page: options.page,
      limit: options.limit
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/products/:id 
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/products 
exports.createProduct = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.stock === undefined && payload.quantity_in_stock !== undefined) {
      payload.stock = payload.quantity_in_stock;
      delete payload.quantity_in_stock;
    }

    const product = await Product.create(payload);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/products/:id 
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/products/:id - (admin only)
exports.deleteProduct = async (req, res) => {
  try {
    await Product.delete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/products/:id/stock
exports.updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const parsedStock = Number(stock);

    if (!Number.isFinite(parsedStock) || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, error: 'Stock must be a non-negative integer' });
    }

    const product = await Product.update(req.params.id, { stock: parsedStock });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const knex = require("../db/knex");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

exports.updatePriceBySalesManager = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const price = Number(req.body?.price);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ success: false, message: "Invalid price" });
    }

    const [updated] = await knex("products")
      .where({ id })
      .update({
        price,
        discount_rate: 0,
        discount_active: false,
        discounted_price: null,
        list_price: null,
      })
      .returning("*");

    if (!updated) return res.status(404).json({ success: false, message: "Product not found" });

    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};



exports.applyDiscountBySalesManager = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);               // DİKKAT: route "/:id/discount"
    const discountRate = Number(req.body?.discountRate);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 90) {
      return res.status(400).json({ message: "Invalid discountRate (0-90)" });
    }

    const product = await knex('products').where({ id: productId }).first();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const originalPrice = Number(product.price);
    const discountedPrice = +(originalPrice * (1 - discountRate / 100)).toFixed(2);

    await knex('products')
      .where({ id: productId })
      .update({
        discount_rate: Math.round(discountRate),
        discounted_price: discountedPrice,
        discount_active: discountRate > 0,
      });

    // ✅ WISHLIST USERLARI BUL + NOTIFICATION INSERT
    const userIds = await WishlistModel.getUserIdsWithProduct(productId);

    const notifyResult = await NotificationService.notifyDiscount({
      userIds,
      productId,
      productName: product.name,
      discountRate: Math.round(discountRate),
    });

    return res.status(200).json({
      message: "Discount applied",
      productId,
      discountRate: Math.round(discountRate),
      discountedPrice,
      notifiedUsers: notifyResult.inserted,
    });
  } catch (err) {
    console.error("applyDiscountBySalesManager error:", err); // ✅ terminalde gör
    return res.status(500).json({ message: err.message || "Server error" });
  }
};
