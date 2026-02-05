const { Pool } = require('pg');
require('dotenv').config();

// Get DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('Warning: DATABASE_URL is not set. Database connections will fail.');
}

// Parse the connection string to extract components
let poolConfig = {};

if (connectionString) {
  try {
    const url = new URL(connectionString);
    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading '/'
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false } // Railway requires SSL
    };
  } catch (e) {
    // If URL parsing fails, fall back to connectionString
    poolConfig = {
      connectionString,
      ssl: { rejectUnauthorized: false }
    };
  }
}

// Create PostgreSQL connection pool
const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

module.exports = pool;
