/**
 * server.js - Krishna Enterprises API Entry Point (Firebase Firestore Edition)
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config();

// Initialize Firebase Admin SDK first
require('./config/firebase');

const authRoutes      = require('./routes/auth.routes');
const productRoutes   = require('./routes/product.routes');
const categoryRoutes  = require('./routes/category.routes');
const cartRoutes      = require('./routes/cart.routes');
const orderRoutes     = require('./routes/order.routes');
const offerRoutes     = require('./routes/offer.routes');
const uploadRoutes    = require('./routes/upload.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const cmsRoutes       = require('./routes/cms.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// --- Security & Utility Middleware -------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// PRD Section 3.B: No-Cache Headers for Dynamic API Endpoints
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  });
  next();
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV !== 'production') return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.railway.app')
    ) return callback(null, true);
    callback(null, true); // permissive during dev
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again after 15 minutes.' },
});
app.use('/api', limiter);

// --- Root & Health Check ---------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Krishna Enterprises API',
    storefront: process.env.FRONTEND_URL || 'http://localhost:3000',
    adminDashboard: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`,
    health: '/api/health',
    endpoints: {
      products: '/api/products',
      categories: '/api/categories',
      cart: '/api/cart',
      orders: '/api/orders',
      auth: '/api/auth',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Krishna Enterprises API Running (Firestore)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// --- API Routes -------------------------------------------------------------
app.use('/api/auth',             authRoutes);
app.use('/api/products',         productRoutes);
app.use('/api/categories',       categoryRoutes);
app.use('/api/cart',             cartRoutes);
app.use('/api/orders',           orderRoutes);
app.use('/api/offers',           offerRoutes);
app.use('/api/upload',           uploadRoutes);
app.use('/api/admin/dashboard',  dashboardRoutes);
app.use('/api/cms',              cmsRoutes);

// --- Error Handling ---------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// --- Start Server -----------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n Grocery API running on port ${PORT}`);
  console.log(` Database: Firebase Firestore (${process.env.FIREBASE_PROJECT_ID || 'krishna-enterprises-77254'})`);
  console.log(` Health: http://localhost:${PORT}/api/health\n`);
});
