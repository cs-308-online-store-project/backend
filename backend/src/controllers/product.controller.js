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
      .update({ price, discount_rate: 0, list_price: null })
      .returning("*");

    if (!updated) return res.status(404).json({ success: false, message: "Product not found" });

    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.applyDiscountBySalesManager = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const discountRate = Number(req.body?.discountRate);

    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) {
      return res.status(400).json({ success: false, message: "discountRate must be 0-100" });
    }

    // product al
    const product = await knex("products").where({ id }).first();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // discount uygulanacak base fiyat:
    const base = product.list_price ? Number(product.list_price) : Number(product.price);
    const newPrice = Number((base * (1 - discountRate / 100)).toFixed(2));

    const [updated] = await knex("products")
      .where({ id })
      .update({
        list_price: base,          // ilk kez discount yiyorsan sakla
        discount_rate: discountRate,
        price: newPrice,           // “automatic price update” requirement
      })
      .returning("*");

    // wishlist kullanıcılarını bul
    const users = await knex("wishlist_items as wi")
      .join("wishlists as w", "wi.wishlist_id", "w.id")
      .join("users as u", "w.user_id", "u.id")
      .where("wi.product_id", id)
      .select("u.email", "u.name");

    // mail (users boşsa skip)
    if (users.length) {
      await Promise.all(
        users.map((u) =>
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: u.email,
            subject: `Discount alert: ${updated.name}`,
            html: `
              <p>Hi ${u.name || ""},</p>
              <p><b>${updated.name}</b> is now discounted!</p>
              <p>New price: <b>$${Number(updated.price).toFixed(2)}</b> (Discount: ${updated.discount_rate}%)</p>
            `,
          })
        )
      );
    }

    return res.json({ success: true, data: updated, notified: users.length });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
