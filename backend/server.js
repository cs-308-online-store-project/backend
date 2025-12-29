require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Routes
const healthRoutes  = require('./src/routes/healthRoutes');
const authRoutes    = require('./src/routes/authRoutes');
const cartRoutes    = require('./src/routes/cartRoutes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes   = require('./src/routes/orderRoutes');
const orderItemRoutes = require('./src/routes/orderItemRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const wishlistRoutes = require('./src/routes/wishlistRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const userRoutes = require('./src/routes/userRoutes');
<<<<<<< Updated upstream
const reportRoutes = require('./src/routes/reportRoutes'); // ✅ sadece require burada
const discountRoutes = require('./src/routes/discountRoutes');
=======
const chatRoutes = require('./src/routes/chatRoutes');
>>>>>>> Stashed changes


// ⬇️ app BURADA tanımlanmalı
const app = express();
const path = require('path');

<<<<<<< Updated upstream
app.use(cors());
=======
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
>>>>>>> Stashed changes
app.use(express.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes mount
<<<<<<< Updated upstream
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
app.use('/api/reports',      reportRoutes); // ✅ DOĞRU YERİ BURASI
app.use('/api/discounts', discountRoutes);
=======
app.use('/api',         healthRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api',         cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/order_items', orderItemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
>>>>>>> Stashed changes

// Root
app.get('/', (req, res) =>
  res.send('CS308 Online Store Backend is running.')
);

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const http = require('http');
  const server = http.createServer(app);
  
  // Initialize Socket.io
  const { initializeSocket } = require('./src/socket');
  initializeSocket(server);
  
  server.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready`);
  });
}

module.exports = app;