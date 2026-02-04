const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Validation rules
const proposalValidation = [
  body('project_id').isInt({ min: 1 }).withMessage('Valid project ID is required'),
  body('proposed_price').isFloat({ min: 0 }).withMessage('Proposed price must be a positive number'),
  body('message').trim().notEmpty().withMessage('Message is required')
];

// POST /api/proposals - Submit proposal (Contractor only)
router.post('/', authenticateToken, authorizeRole('Contractor'), proposalValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { project_id, proposed_price, message } = req.body;
  const contractorId = req.user.userId;

  try {
    // Check if project exists and is open
    const projectCheck = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1 AND status = $2',
      [project_id, 'Open']
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or not accepting proposals' });
    }

    // Check if contractor already submitted a proposal
    const existingProposal = await pool.query(
      'SELECT * FROM proposals WHERE project_id = $1 AND contractor_id = $2',
      [project_id, contractorId]
    );

    if (existingProposal.rows.length > 0) {
      return res.status(409).json({ error: 'You have already submitted a proposal for this project' });
    }

    // Create proposal
    const result = await pool.query(
      `INSERT INTO proposals (project_id, contractor_id, proposed_price, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [project_id, contractorId, proposed_price, message]
    );

    res.status(201).json({
      message: 'Proposal submitted successfully',
      proposal: result.rows[0]
    });

  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ error: 'Server error while submitting proposal' });
  }
});

// GET /api/proposals/project/:id - Get all proposals for a project (Homeowner only)
router.get('/project/:id', authenticateToken, authorizeRole('Homeowner'), async (req, res) => {
  const projectId = req.params.id;
  const homeownerId = req.user.userId;

  try {
    // Verify project ownership
    const ownerCheck = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1 AND homeowner_id = $2',
      [projectId, homeownerId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to view proposals for this project' });
    }

    // Get all proposals
    const result = await pool.query(
      `SELECT pr.*, u.name as contractor_name, u.email as contractor_email, u.is_verified
       FROM proposals pr
       JOIN users u ON pr.contractor_id = u.user_id
       WHERE pr.project_id = $1
       ORDER BY pr.created_at DESC`,
      [projectId]
    );

    res.json({
      proposals: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ error: 'Server error while fetching proposals' });
  }
});

// GET /api/proposals/my - Get contractor's own proposals
router.get('/my', authenticateToken, authorizeRole('Contractor'), async (req, res) => {
  const contractorId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT pr.*, p.title as project_title, p.description as project_description,
              p.location as project_location, p.status as project_status
       FROM proposals pr
       JOIN projects p ON pr.project_id = p.project_id
       WHERE pr.contractor_id = $1
       ORDER BY pr.created_at DESC`,
      [contractorId]
    );

    res.json({
      proposals: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({ error: 'Server error while fetching proposals' });
  }
});

// PUT /api/proposals/:id/accept - Accept a proposal (Homeowner only)
router.put('/:id/accept', authenticateToken, authorizeRole('Homeowner'), async (req, res) => {
  const proposalId = req.params.id;
  const homeownerId = req.user.userId;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get proposal and verify ownership
    const proposalResult = await client.query(
      `SELECT pr.*, p.homeowner_id, p.project_id
       FROM proposals pr
       JOIN projects p ON pr.project_id = p.project_id
       WHERE pr.proposal_id = $1`,
      [proposalId]
    );

    if (proposalResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposal = proposalResult.rows[0];

    if (proposal.homeowner_id !== homeownerId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You do not have permission to accept this proposal' });
    }

    // Accept the proposal
    await client.query(
      `UPDATE proposals SET status = 'Accepted' WHERE proposal_id = $1`,
      [proposalId]
    );

    // Reject all other proposals for this project
    await client.query(
      `UPDATE proposals 
       SET status = 'Rejected' 
       WHERE project_id = $1 AND proposal_id != $2 AND status = 'Pending'`,
      [proposal.project_id, proposalId]
    );

    // Update project status to Accepted
    await client.query(
      `UPDATE projects SET status = 'Accepted' WHERE project_id = $1`,
      [proposal.project_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Proposal accepted successfully',
      proposalId: proposalId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Accept proposal error:', error);
    res.status(500).json({ error: 'Server error while accepting proposal' });
  } finally {
    client.release();
  }
});

// DELETE /api/proposals/:id - Delete/withdraw proposal (Contractor only, if pending)
router.delete('/:id', authenticateToken, authorizeRole('Contractor'), async (req, res) => {
  const proposalId = req.params.id;
  const contractorId = req.user.userId;

  try {
    // Check ownership and status
    const proposalCheck = await pool.query(
      'SELECT * FROM proposals WHERE proposal_id = $1 AND contractor_id = $2',
      [proposalId, contractorId]
    );

    if (proposalCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to delete this proposal' });
    }

    if (proposalCheck.rows[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending proposals can be withdrawn' });
    }

    // Delete proposal
    await pool.query(
      'DELETE FROM proposals WHERE proposal_id = $1 AND contractor_id = $2',
      [proposalId, contractorId]
    );

    res.json({ message: 'Proposal withdrawn successfully' });

  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ error: 'Server error while deleting proposal' });
  }
});

module.exports = router;
