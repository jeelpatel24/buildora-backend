const pool = require('../config/database');

const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Starting database initialization...');

    // Drop existing tables (for clean setup)
    await client.query('DROP TABLE IF EXISTS proposals CASCADE');
    await client.query('DROP TABLE IF EXISTS projects CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✓ Dropped existing tables');

    // Create Users table
    await client.query(`
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
    await client.query(`
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
    await client.query(`
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

    // Create indexes for better query performance
    await client.query('CREATE INDEX idx_projects_homeowner ON projects(homeowner_id)');
    await client.query('CREATE INDEX idx_projects_status ON projects(status)');
    await client.query('CREATE INDEX idx_proposals_project ON proposals(project_id)');
    await client.query('CREATE INDEX idx_proposals_contractor ON proposals(contractor_id)');
    console.log('✓ Created indexes');

    // Insert sample admin user (password: admin123)
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES ('Admin User', 'admin@buildora.com', $1, 'Admin', TRUE)
    `, [adminPassword]);
    console.log('✓ Created admin user (admin@buildora.com / admin123)');

    console.log('\n✓ Database initialization completed successfully!');
    console.log('\nYou can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run initialization
initDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
