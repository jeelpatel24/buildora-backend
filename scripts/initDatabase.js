const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Direct connection (not parsing URL to avoid issues)
const pool = new Pool({
  host: 'yamabiko.proxy.rlwy.net',
  port: 10164,
  database: 'railway',
  user: 'postgres',
  password: 'tQjyFqHmiishmuaUKQlgFcwGorGCCLXg',
  ssl: { rejectUnauthorized: false }
});

const initDatabase = async () => {
  console.log('Connecting to database...');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected successfully\n');
    
    console.log('Starting database initialization...');

    // Drop existing tables
    await pool.query('DROP TABLE IF EXISTS proposals CASCADE');
    await pool.query('DROP TABLE IF EXISTS projects CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✓ Dropped existing tables');

    // Create Users table
    await pool.query(`
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('Homeowner', 'Contractor', 'Admin')),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created users table');

    // Create Projects table
    await pool.query(`
      CREATE TABLE projects (
        project_id SERIAL PRIMARY KEY,
        homeowner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        budget_min DECIMAL(10,2) NOT NULL,
        budget_max DECIMAL(10,2) NOT NULL,
        location VARCHAR(200) NOT NULL,
        status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Accepted', 'Closed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created projects table');

    // Create Proposals table
    await pool.query(`
      CREATE TABLE proposals (
        proposal_id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        contractor_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        proposed_price DECIMAL(10,2) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, contractor_id)
      )
    `);
    console.log('✓ Created proposals table');

    // Create indexes
    await pool.query('CREATE INDEX idx_projects_homeowner ON projects(homeowner_id)');
    await pool.query('CREATE INDEX idx_projects_status ON projects(status)');
    await pool.query('CREATE INDEX idx_proposals_project ON proposals(project_id)');
    await pool.query('CREATE INDEX idx_proposals_contractor ON proposals(contractor_id)');
    console.log('✓ Created indexes');

    // Insert admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES ('Admin User', 'admin@buildora.com', $1, 'Admin', TRUE)
    `, [adminPassword]);
    console.log('✓ Created admin user (admin@buildora.com / admin123)');

    console.log('\n✅ Database initialization completed successfully!\n');
    
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
