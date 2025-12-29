require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes = require('./src/routes/orderRoutes');
const orderItemRoutes = require('./src/routes/orderItemRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

// Optional feature routes (dosyalar gerçekten varsa kalsın)
const discountRoutes = require('./src/routes/discountRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

const app = express();

// CORS (tek yerde, güvenli ayar)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mount
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', cartRoutes);

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order_items', orderItemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

app.use('/api/reports', reportRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Root
app.get('/', (req, res) => {
  res.send('CS308 Online Store Backend is running.');
});

// 404 (must be last route)
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Global error handler (must be LAST middleware)
app.use((err, req, res, next) => {
  console.error('🔥 UNHANDLED ERROR:', err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const http = require('http');
  const server = http.createServer(app);

  // Initialize Socket.io (chat için)
  const { initializeSocket } = require('./src/socket');
  initializeSocket(server);

  server.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
    console.log('🔌 Socket.io ready');
  });
}

module.exports = app;