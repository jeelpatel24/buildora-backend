const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// PUT /api/admin/verify/:userId - Verify a contractor
router.put('/verify/:userId', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const userId = req.params.userId;

  try {
    // Check if user exists and is a contractor
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE user_id = $1 AND role = $2',
      [userId, 'Contractor']
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Verify contractor
    await pool.query(
      'UPDATE users SET is_verified = TRUE WHERE user_id = $1',
      [userId]
    );

    res.json({ message: 'Contractor verified successfully' });

  } catch (error) {
    console.error('Verify contractor error:', error);
    res.status(500).json({ error: 'Server error while verifying contractor' });
  }
});

// PUT /api/admin/deactivate/:userId - Deactivate a user (soft delete)
router.put('/deactivate/:userId', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  const userId = req.params.userId;
  const adminId = req.user.userId;

  try {
    // Prevent admin from deactivating themselves
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For this implementation, we'll use is_verified = FALSE as deactivation
    // In production, you'd want a separate is_active field
    await pool.query(
      'UPDATE users SET is_verified = FALSE WHERE user_id = $1',
      [userId]
    );

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Server error while deactivating user' });
  }
});

// GET /api/admin/users - Get all users (Admin only)
router.get('/users', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name, email, role, is_verified, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      users: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// GET /api/admin/stats - Get platform statistics
router.get('/stats', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const stats = {};

    // Total users by role
    const userStats = await pool.query(
      `SELECT role, COUNT(*) as count 
       FROM users 
       GROUP BY role`
    );
    stats.users = userStats.rows;

    // Project statistics
    const projectStats = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM projects 
       GROUP BY status`
    );
    stats.projects = projectStats.rows;

    // Proposal statistics
    const proposalStats = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM proposals 
       GROUP BY status`
    );
    stats.proposals = proposalStats.rows;

    // Verified contractors
    const verifiedContractors = await pool.query(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE role = 'Contractor' AND is_verified = TRUE`
    );
    stats.verifiedContractors = verifiedContractors.rows[0].count;

    res.json({ stats });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error while fetching statistics' });
  }
});

module.exports = router;
