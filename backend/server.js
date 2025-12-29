require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Routes
const healthRoutes      = require('./src/routes/healthRoutes');
const authRoutes        = require('./src/routes/authRoutes');
const cartRoutes        = require('./src/routes/cartRoutes');
const productRoutes     = require('./src/routes/product.routes');
const orderRoutes       = require('./src/routes/orderRoutes');
const orderItemRoutes   = require('./src/routes/orderItemRoutes');
const categoryRoutes    = require('./src/routes/categoryRoutes');
const wishlistRoutes    = require('./src/routes/wishlistRoutes');
const invoiceRoutes     = require('./src/routes/invoiceRoutes');
const reviewRoutes      = require('./src/routes/reviewRoutes');
const userRoutes        = require('./src/routes/userRoutes');
const reportRoutes      = require('./src/routes/reportRoutes');

// ✅ ADD THESE:
const notificationRoutes = require('./src/routes/notificationRoutes');
const discountRoutes     = require('./src/routes/discountRoutes'); // dosya varsa

const app = express();

app.use(cors());
app.use(express.json());

// (Opsiyonel) request log
// app.use((req, res, next) => {
//   console.log("REQ:", req.method, req.originalUrl);
//   next();
// });

// Routes mount
app.use('/api',              healthRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api',              cartRoutes);
app.use('/api/products',     productRoutes);
app.use('/api/orders',       orderRoutes);
app.use('/api/order_items',  orderItemRoutes);
app.use('/api/categories',   categoryRoutes);
app.use('/api/wishlist',     wishlistRoutes);
app.use('/api/invoices',     invoiceRoutes);
app.use('/api/reviews',      reviewRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/reports',      reportRoutes);

// ✅ new
app.use('/api/notifications', notificationRoutes);

// ✅ only if you really use /api/discounts routes
app.use('/api/discounts', discountRoutes);

// Root
app.get('/', (req, res) => {
  res.send('CS308 Online Store Backend is running.');
});

// 404 (must be last route)
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Global error handler (must be LAST middleware)
app.use((err, req, res, next) => {
  console.error("🔥 UNHANDLED ERROR:", err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;