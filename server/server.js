require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, checkDatabaseHealth } = require('./db');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const paymentRouter = require('./routes/payment');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend dev server
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'x-razorpay-signature']
}));

// Body parser (except raw webhook route which parses inside paymentRouter)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public directory
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));
app.use('/images', express.static(path.join(publicDir, 'images')));
app.use('/video', express.static(path.join(publicDir, 'video')));

// Ensure database initialization completes before executing API handlers (serverless & continuous)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/images') || req.path.startsWith('/video')) {
    return next();
  }
  try {
    await initDatabase();
    next();
  } catch (err) {
    console.error('[Database Init Middleware Error]', err.message);
    res.status(503).json({
      error: 'Database connection unavailable',
      details: err.message
    });
  }
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint with live Supabase PostgreSQL connectivity verification
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const isHealthy = dbHealth.status === 'healthy';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    brand: 'Blush',
    location: 'Pune, Maharashtra, India',
    established: 2014,
    database: {
      type: 'Supabase PostgreSQL',
      status: dbHealth.status,
      database: dbHealth.database,
      latency: dbHealth.latencyMs ? `${dbHealth.latencyMs}ms` : undefined
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Dual-mode execution: listen when run directly via CLI, export app when required by serverless
if (require.main === module) {
  initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` ✨ Blush Fashion E-Commerce Server`);
      console.log(` 📍 Location: Pune, Maharashtra, India (Est. 2014)`);
      console.log(` 🚀 Server listening on: http://localhost:${PORT}`);
      console.log(` 🛍️  API Endpoints ready at http://localhost:${PORT}/api/`);
      console.log(`===============================================`);
    });
  }).catch(err => {
    console.error('Failed to initialize database on startup:', err);
  });
}

module.exports = app;
