require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// =============================================================================
// DATABASE INITIALISATION SCRIPT
// Run with:  npm run init-db
//
// WARNING: This script DROPS and recreates all tables. Only run it on a fresh
// database or when you intentionally want to reset all data.
//
// Requires DATABASE_URL to be set in your .env file before running.
// =============================================================================

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Create a .env file based on .env.example and set DATABASE_URL.');
  process.exit(1);
}

// Parse the connection string the same way config/database.js does
let poolConfig = {};
try {
  const url = new URL(connectionString);
  poolConfig = {
    host:     url.hostname,
    port:     parseInt(url.port) || 5432,
    database: url.pathname.slice(1), // remove leading '/'
    user:     url.username,
    password: url.password,
    ssl:      { rejectUnauthorized: false } // required for Railway/cloud hosts
  };
} catch (e) {
  // Fall back to raw connection string if URL parsing fails
  poolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false }
  };
}

const pool = new Pool(poolConfig);

const initDatabase = async () => {
  console.log('Connecting to database...');

  try {
    // Verify the connection is working before making any schema changes
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected successfully\n');

    console.log('Starting database initialisation...');

    // Drop tables in reverse dependency order to avoid FK constraint errors
    await pool.query('DROP TABLE IF EXISTS proposals CASCADE');
    await pool.query('DROP TABLE IF EXISTS projects CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✓ Dropped existing tables');

    // -------------------------------------------------------------------------
    // TABLE: users
    // Stores all platform users — Homeowners, Contractors, and Admins.
    // password_hash stores a bcrypt hash; plaintext passwords are never stored.
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE users (
        user_id       SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  NOT NULL CHECK (role IN ('Homeowner', 'Contractor', 'Admin')),
        is_verified   BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created users table');

    // -------------------------------------------------------------------------
    // TABLE: projects  (Resource A)
    // Renovation projects posted by Homeowners.
    // homeowner_id FK references users — CASCADE DELETE removes projects if
    // the owning user is deleted.
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE projects (
        project_id   SERIAL PRIMARY KEY,
        homeowner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title        VARCHAR(200) NOT NULL,
        description  TEXT         NOT NULL,
        budget_min   DECIMAL(10,2) NOT NULL,
        budget_max   DECIMAL(10,2) NOT NULL,
        location     VARCHAR(200) NOT NULL,
        status       VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Accepted', 'Closed')),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created projects table');

    // -------------------------------------------------------------------------
    // TABLE: proposals  (Resource B — One-to-Many with projects)
    // Bids submitted by Contractors on open Projects.
    // UNIQUE(project_id, contractor_id) enforces one proposal per contractor
    // per project at the database level.
    // -------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE proposals (
        proposal_id    SERIAL PRIMARY KEY,
        project_id     INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        contractor_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        proposed_price DECIMAL(10,2) NOT NULL,
        message        TEXT NOT NULL,
        status         VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, contractor_id)
      )
    `);
    console.log('✓ Created proposals table');

    // Indexes speed up the most common query patterns
    await pool.query('CREATE INDEX idx_projects_homeowner ON projects(homeowner_id)');
    await pool.query('CREATE INDEX idx_projects_status    ON projects(status)');
    await pool.query('CREATE INDEX idx_proposals_project  ON proposals(project_id)');
    await pool.query('CREATE INDEX idx_proposals_contractor ON proposals(contractor_id)');
    console.log('✓ Created indexes');

    // Seed the default admin user so the admin panel is accessible immediately
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES ('Admin User', 'admin@buildora.com', $1, 'Admin', TRUE)
    `, [adminPassword]);
    console.log('✓ Created admin user  →  admin@buildora.com / admin123');

    console.log('\n✅ Database initialisation completed successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
};

initDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
