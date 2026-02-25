const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// =============================================================================
// HELPER: Validate that :userId is a positive integer.
// Prevents database errors for non-numeric user IDs (e.g. /admin/verify/abc).
// =============================================================================
const validateUserId = param('userId')
  .isInt({ min: 1 })
  .withMessage('User ID must be a positive integer');

// =============================================================================
// PUT /api/admin/verify/:userId
// Grant "verified" status to a Contractor account.
// Access: Admin only (JWT required + role check).
// Use case: An admin reviews a contractor's credentials and marks them as
//           trustworthy so homeowners see a verified badge on their proposals.
// Returns: 200 OK on success, 404 if user doesn't exist or isn't a Contractor.
// =============================================================================
router.put(
  '/verify/:userId',
  authenticateToken,
  authorizeRole('Admin'),
  validateUserId,
  async (req, res) => {
    // Reject non-integer user IDs early
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.userId;

    try {
      // Confirm the user exists AND has the Contractor role
      // (Admins and Homeowners cannot be "verified" through this endpoint)
      const userCheck = await pool.query(
        'SELECT * FROM users WHERE user_id = $1 AND role = $2',
        [userId, 'Contractor']
      );

      if (userCheck.rows.length === 0) {
        // 404 — user doesn't exist or is not a Contractor
        return res.status(404).json({ error: 'Contractor not found' });
      }

      // Set is_verified to TRUE for this contractor
      await pool.query(
        'UPDATE users SET is_verified = TRUE WHERE user_id = $1',
        [userId]
      );

      return res.status(200).json({ message: 'Contractor verified successfully' });
    } catch (error) {
      console.error('Verify contractor error:', error);
      return res.status(500).json({ error: 'Server error while verifying contractor' });
    }
  }
);

// =============================================================================
// PUT /api/admin/deactivate/:userId
// Soft-deactivate a user account by setting is_verified = FALSE.
// Access: Admin only.
// Note:   An admin cannot deactivate their own account to prevent lock-out.
//         This uses is_verified as a simple active/inactive toggle.
// Returns: 200 OK on success.
// =============================================================================
router.put(
  '/deactivate/:userId',
  authenticateToken,
  authorizeRole('Admin'),
  validateUserId,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.params.userId;
    const adminId = req.user.userId; // the currently authenticated admin's ID

    // Prevent an admin from locking themselves out of the system
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    try {
      // Confirm the target user exists
      const userCheck = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Soft-deactivate by flipping is_verified to FALSE
      await pool.query(
        'UPDATE users SET is_verified = FALSE WHERE user_id = $1',
        [userId]
      );

      return res.status(200).json({ message: 'User deactivated successfully' });
    } catch (error) {
      console.error('Deactivate user error:', error);
      return res.status(500).json({ error: 'Server error while deactivating user' });
    }
  }
);

// =============================================================================
// GET /api/admin/users
// Return a list of all registered users on the platform.
// Access: Admin only.
// Note:   password_hash is explicitly excluded from the SELECT to ensure
//         hashed passwords are never transmitted over the network.
// Returns: 200 OK with the full user list (newest first) and a total count.
// =============================================================================
router.get('/users', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    // Exclude password_hash — sensitive data must never leave the server
    const result = await pool.query(
      `SELECT user_id, name, email, role, is_verified, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      users: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// =============================================================================
// GET /api/admin/stats
// Return aggregated platform statistics for the admin dashboard.
// Access: Admin only.
// Runs four lightweight COUNT queries and assembles them into one response:
//   - users: breakdown by role (Homeowner / Contractor / Admin)
//   - projects: breakdown by status (Open / Accepted / Closed)
//   - proposals: breakdown by status (Pending / Accepted / Rejected)
//   - verifiedContractors: total count of verified Contractor accounts
// Returns: 200 OK with the stats object.
// =============================================================================
router.get('/stats', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const stats = {};

    // User counts grouped by role
    const userStats = await pool.query(
      `SELECT role, COUNT(*) AS count
       FROM users
       GROUP BY role`
    );
    stats.users = userStats.rows;

    // Project counts grouped by status
    const projectStats = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM projects
       GROUP BY status`
    );
    stats.projects = projectStats.rows;

    // Proposal counts grouped by status
    const proposalStats = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM proposals
       GROUP BY status`
    );
    stats.proposals = proposalStats.rows;

    // Total number of contractors verified by an admin
    const verifiedContractors = await pool.query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE role = 'Contractor' AND is_verified = TRUE`
    );
    stats.verifiedContractors = verifiedContractors.rows[0].count;

    return res.status(200).json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Server error while fetching statistics' });
  }
});

module.exports = router;
