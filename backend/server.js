// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Routes
const healthRoutes  = require('./src/routes/healthRoutes');
const authRoutes    = require('./src/routes/authRoutes');
const cartRoutes    = require('./src/routes/cartRoutes');
const productRoutes = require('./src/routes/product.routes');
const orderRoutes   = require('./src/routes/orderRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes mount
app.use('/api',         healthRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api',         cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// Root
app.get('/', (req, res) => res.send('CS308 Online Store Backend is running.'));

module.exports = app;
