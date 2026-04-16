// Load environment variables from .env before anything else
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./config/database');

// =============================================================================
// ROUTE MODULES
// =============================================================================
const authRoutes     = require('./routes/auth');
const projectRoutes  = require('./routes/projects');
const proposalRoutes = require('./routes/proposals');
const adminRoutes    = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// Allow cross-origin requests — needed during local development where the
// Vite dev server (port 5173) calls the Express API (port 3000).
// In production everything is on the same origin so CORS is a no-op.
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// HEALTH CHECK — PUBLIC
// Used by Render to confirm the service is alive after deployment.
// =============================================================================
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Buildora API is running' });
});

// =============================================================================
// API ROUTES
// All business-logic routes are namespaced under /api/
// =============================================================================
app.use('/api/auth',      authRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/admin',     adminRoutes);

// 404 for unmatched API routes (must come before the static-file catch-all)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// =============================================================================
// SERVE REACT FRONTEND IN PRODUCTION
// When NODE_ENV=production the Express server also serves the compiled React
// app from frontend/dist.  React Router handles client-side navigation, so
// every non-API request returns index.html and the browser-side router takes
// over from there.
// =============================================================================
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development: catch-all returns a helpful message instead of HTML
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error:   'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// =============================================================================
// START SERVER
// =============================================================================
app.listen(PORT, () => {
  console.log('=================================');
  console.log('  Buildora Backend Server');
  console.log('=================================');
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Port:        ${PORT}`);
  console.log('=================================');
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
process.on('SIGTERM', async () => {
  console.log('SIGTERM: closing server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT: closing server');
  await pool.end();
  process.exit(0);
});

module.exports = app;
