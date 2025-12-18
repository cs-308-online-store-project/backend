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

const app = express();

app.use(cors());

// Middlewares
app.use(express.json());

// Routes mount
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

// Root
app.get('/', (req, res) =>
  res.send('CS308 Online Store Backend is running.')
);

// 404 & error handler
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;