// Load environment variables from .env before anything else accesses them
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

// =============================================================================
// ROUTE MODULES
// Each resource has its own router file for separation of concerns.
// =============================================================================
const authRoutes     = require('./routes/auth');      // POST /register, POST /login
const projectRoutes  = require('./routes/projects');  // CRUD for Projects
const proposalRoutes = require('./routes/proposals'); // CRUD for Proposals
const adminRoutes    = require('./routes/admin');     // Admin management routes

// Initialize Express application
const app = express();

// Use PORT from environment (Railway injects this automatically) or fall back to 3000
const PORT = process.env.PORT || 3000;

// =============================================================================
// GLOBAL MIDDLEWARE
// Applied to every incoming request before route handlers run.
// =============================================================================

// Enable Cross-Origin Resource Sharing so the Phase 2 frontend can call this API
app.use(cors());

// Parse incoming JSON request bodies (e.g. { "email": "...", "password": "..." })
app.use(express.json());

// Parse URL-encoded bodies (standard HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// Request logger — logs method and path for every request to aid debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// HEALTH CHECK — PUBLIC ROUTE
// Returns API status and a map of available route groups.
// Railway uses this endpoint (configured in railway.json) to confirm the
// service is alive before marking the deployment as healthy.
// =============================================================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Buildora API is running',
    version: '1.0.0',
    endpoints: {
      auth:      '/api/auth',
      projects:  '/api/projects',
      proposals: '/api/proposals',
      admin:     '/api/admin'
    }
  });
});

// =============================================================================
// API ROUTES
// All routes are prefixed with /api/ for clear namespacing.
// Authentication middleware is applied inside each router file, not here.
// =============================================================================
app.use('/api/auth',      authRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/admin',     adminRoutes);

// =============================================================================
// 404 HANDLER
// Catches any request that did not match a defined route above.
// =============================================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// =============================================================================
// GLOBAL ERROR HANDLER
// Catches unhandled errors thrown by any route or middleware.
// In development, the error message is included for easier debugging.
// In production, a generic message is returned to avoid leaking internals.
// =============================================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =============================================================================
// START SERVER
// =============================================================================
app.listen(PORT, () => {
  console.log('=================================');
  console.log('  Buildora Backend Server');
  console.log('=================================');
  console.log(`✓ Server running on port   ${PORT}`);
  console.log(`✓ Environment:             ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ API Base URL:            http://localhost:${PORT}`);
  console.log('=================================');
  console.log('Available endpoints:');
  console.log('  GET    /                           Health check (public)');
  console.log('  POST   /api/auth/register          Register new user (public)');
  console.log('  POST   /api/auth/login             Login user (public)');
  console.log('  POST   /api/projects               Create project (Homeowner)');
  console.log('  GET    /api/projects               List open projects (any auth)');
  console.log('  GET    /api/projects/my            My projects (Homeowner)');
  console.log('  GET    /api/projects/:id           Get project by ID (any auth)');
  console.log('  PUT    /api/projects/:id           Update project (Homeowner)');
  console.log('  DELETE /api/projects/:id           Delete project (Homeowner)');
  console.log('  POST   /api/proposals              Submit proposal (Contractor)');
  console.log('  GET    /api/proposals/project/:id  Project proposals (Homeowner)');
  console.log('  GET    /api/proposals/my           My proposals (Contractor)');
  console.log('  PUT    /api/proposals/:id/accept   Accept proposal (Homeowner)');
  console.log('  DELETE /api/proposals/:id          Withdraw proposal (Contractor)');
  console.log('  GET    /api/admin/users            All users (Admin)');
  console.log('  GET    /api/admin/stats            Platform stats (Admin)');
  console.log('  PUT    /api/admin/verify/:userId   Verify contractor (Admin)');
  console.log('  PUT    /api/admin/deactivate/:id   Deactivate user (Admin)');
  console.log('=================================');
});

// =============================================================================
// GRACEFUL SHUTDOWN
// Closes the PostgreSQL connection pool cleanly when the process receives a
// termination signal (SIGTERM from Railway, SIGINT from Ctrl+C locally).
// This prevents active queries from being abruptly dropped mid-execution.
// =============================================================================
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
