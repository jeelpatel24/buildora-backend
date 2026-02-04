require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const proposalRoutes = require('./routes/proposals');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Buildora API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      proposals: '/api/proposals',
      admin: '/api/admin'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log('  Buildora Backend Server');
  console.log('=================================');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ API Base URL: http://localhost:${PORT}`);
  console.log('=================================');
  console.log('Available endpoints:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/projects');
  console.log('  GET    /api/projects');
  console.log('  GET    /api/projects/:id');
  console.log('  POST   /api/proposals');
  console.log('  GET    /api/proposals/project/:id');
  console.log('  PUT    /api/proposals/:id/accept');
  console.log('  PUT    /api/admin/verify/:userId');
  console.log('=================================');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

module.exports = app;
