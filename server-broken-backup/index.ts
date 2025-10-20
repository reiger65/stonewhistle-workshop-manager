import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import itemRoutes from './routes/items.js';
import inventoryRoutes from './routes/inventory.js';
import timesheetRoutes from './routes/timesheets.js';
import reportRoutes from './routes/reports.js';
import resellerRoutes from './routes/resellers.js';
import shopifyRoutes from './routes/shopify.js';

// Import database
import { db } from './db/connection.js';

// Import passport config
import './config/passport.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files (for production build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resellers', resellerRoutes);
app.use('/api', shopifyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;