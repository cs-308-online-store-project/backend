require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Routes
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes   = require('./src/routes/authRoutes');
const cartRoutes   = require('./src/routes/cartRoutes');
const productRoutes = require('./src/routes/product.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
feature/SCRUM-16-product-crud
// Routes mount
app.use('/api',        healthRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api',        cartRoutes);
app.use('/api/products', productRoutes);

// Routes
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes   = require('./src/routes/authRoutes');   // <-- VAR
const cartRoutes   = require('./src/routes/cartRoutes');   

app.use('/api',      healthRoutes);  // /api/health
app.use('/api/auth', authRoutes);    // /api/auth/register, /api/auth/login
app.use('/api', cartRoutes);    // /api/cart/...
main

// Root
app.get('/', (req, res) => res.send('CS308 Online Store Backend is running.'));

feature/SCRUM-16-product-crud
module.exports = app;
// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on http://localhost:${PORT}`));main
