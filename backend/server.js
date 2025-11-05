require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes   = require('./src/routes/authRoutes');   // <-- VAR
const cartRoutes   = require('./src/routes/cartRoutes');   

app.use('/api',      healthRoutes);  // /api/health
app.use('/api/auth', authRoutes);    // /api/auth/register, /api/auth/login
app.use('/api', cartRoutes);    // /api/cart/...

// Root
app.get('/', (req, res) => res.send('CS308 Online Store Backend is running.'));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on http://localhost:${PORT}`));
