const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// =============================================================================
// HELPER: Validate that a route :id param is a positive integer.
// Reused on GET /project/:id, PUT /:id/accept, and DELETE /:id to return 400
// instead of a database error when a non-numeric value is supplied.
// =============================================================================
const validateId = param('id')
  .isInt({ min: 1 })
  .withMessage('ID must be a positive integer');

// =============================================================================
// VALIDATION RULES — applied to POST /api/proposals (submit proposal).
// project_id must reference a real project; price must be a positive number.
// =============================================================================
const proposalValidation = [
  body('project_id')
    .isInt({ min: 1 })
    .withMessage('Valid project ID is required'),
  body('proposed_price')
    .isFloat({ min: 0 })
    .withMessage('Proposed price must be a positive number'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
];

// =============================================================================
// POST /api/proposals
// Submit a bid proposal for an open project.
// Access:  Contractor only (JWT required + role check).
// Rules:
//   - The project must exist and have status = 'Open'.
//   - A contractor can only submit ONE proposal per project (UNIQUE constraint
//     in the DB, also pre-checked here for a clean 409 response).
// Returns: 201 Created with the new proposal row on success.
// =============================================================================
router.post(
  '/',
  authenticateToken,
  authorizeRole('Contractor'),
  proposalValidation,
  async (req, res) => {
    // Collect all validation errors before responding
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project_id, proposed_price, message } = req.body;
    const contractorId = req.user.userId; // sourced from the verified JWT payload

    try {
      // Check that the project exists and is still accepting proposals
      const projectCheck = await pool.query(
        'SELECT * FROM projects WHERE project_id = $1 AND status = $2',
        [project_id, 'Open']
      );

      if (projectCheck.rows.length === 0) {
        // 404 covers both "doesn't exist" and "no longer open"
        return res.status(404).json({
          error: 'Project not found or not accepting proposals'
        });
      }

      // Check for a duplicate proposal from this contractor on this project
      const existingProposal = await pool.query(
        'SELECT * FROM proposals WHERE project_id = $1 AND contractor_id = $2',
        [project_id, contractorId]
      );

      if (existingProposal.rows.length > 0) {
        // 409 Conflict — the contractor already has a proposal for this project
        return res.status(409).json({
          error: 'You have already submitted a proposal for this project'
        });
      }

      // Insert the new proposal; status defaults to 'Pending' (set in DB schema)
      const result = await pool.query(
        `INSERT INTO proposals (project_id, contractor_id, proposed_price, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [project_id, contractorId, proposed_price, message]
      );

      // 201 Created — new resource successfully inserted
      return res.status(201).json({
        message: 'Proposal submitted successfully',
        proposal: result.rows[0]
      });
    } catch (error) {
      console.error('Submit proposal error:', error);
      return res.status(500).json({ error: 'Server error while submitting proposal' });
    }
  }
);

// =============================================================================
// GET /api/proposals/project/:id
// Retrieve all proposals submitted for a specific project.
// Access:  Homeowner only, and only the project's owner may view its proposals.
// Note:    Returns 404 if the project doesn't exist, and 403 if the project
//          exists but the requester doesn't own it. This avoids the misleading
//          pattern of returning an empty 200 array when the project is missing.
// Returns: 200 OK with the proposals array including contractor details.
// =============================================================================
router.get(
  '/project/:id',
  authenticateToken,
  authorizeRole('Homeowner'),
  validateId,
  async (req, res) => {
    // Reject non-integer IDs early with a clear 400
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = req.params.id;
    const homeownerId = req.user.userId;

    try {
      // Step 1: Confirm the project exists
      const projectCheck = await pool.query(
        'SELECT * FROM projects WHERE project_id = $1',
        [projectId]
      );

      if (projectCheck.rows.length === 0) {
        // 404 — the project itself does not exist
        return res.status(404).json({ error: 'Project not found' });
      }

      // Step 2: Confirm the requester owns the project
      if (projectCheck.rows[0].homeowner_id !== homeownerId) {
        // 403 — project exists but this user has no right to view its proposals
        return res.status(403).json({
          error: 'You do not have permission to view proposals for this project'
        });
      }

      // Step 3: Fetch all proposals with contractor details joined in
      const result = await pool.query(
        `SELECT pr.*, u.name AS contractor_name, u.email AS contractor_email,
                u.is_verified AS contractor_verified
         FROM proposals pr
         JOIN users u ON pr.contractor_id = u.user_id
         WHERE pr.project_id = $1
         ORDER BY pr.created_at DESC`,
        [projectId]
      );

      return res.status(200).json({
        proposals: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Get proposals error:', error);
      return res.status(500).json({ error: 'Server error while fetching proposals' });
    }
  }
);

// =============================================================================
// GET /api/proposals/my
// Return all proposals submitted by the currently authenticated contractor.
// Access:  Contractor only.
// Joins with projects to include relevant project details so the contractor
// can track the status of each project they've bid on without extra requests.
// Returns: 200 OK with the contractor's proposals and related project info.
// =============================================================================
router.get(
  '/my',
  authenticateToken,
  authorizeRole('Contractor'),
  async (req, res) => {
    const contractorId = req.user.userId;

    try {
      const result = await pool.query(
        `SELECT pr.*,
                p.title AS project_title,
                p.description AS project_description,
                p.location AS project_location,
                p.status AS project_status
         FROM proposals pr
         JOIN projects p ON pr.project_id = p.project_id
         WHERE pr.contractor_id = $1
         ORDER BY pr.created_at DESC`,
        [contractorId]
      );

      return res.status(200).json({
        proposals: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Get my proposals error:', error);
      return res.status(500).json({ error: 'Server error while fetching proposals' });
    }
  }
);

// =============================================================================
// PUT /api/proposals/:id/accept
// Accept a contractor's proposal, atomically closing the bidding on that project.
// Access:  Homeowner only, and only the project's owner may accept a proposal.
// This operation uses a DB transaction to ensure ALL three changes happen
// together or not at all (atomicity):
//   1. Mark the chosen proposal as 'Accepted'.
//   2. Reject all other pending proposals on the same project.
//   3. Update the project status to 'Accepted' (closes it to further bids).
// Returns: 200 OK with the accepted proposal ID.
// =============================================================================
router.put(
  '/:id/accept',
  authenticateToken,
  authorizeRole('Homeowner'),
  validateId,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const proposalId = req.params.id;
    const homeownerId = req.user.userId;

    // Acquire a dedicated client for the transaction so BEGIN/COMMIT are scoped
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Fetch the proposal and its parent project in one query
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

      // Verify the homeowner owns the project this proposal belongs to
      if (proposal.homeowner_id !== homeownerId) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          error: 'You do not have permission to accept this proposal'
        });
      }

      // Atomic operation 1: Accept the chosen proposal
      await client.query(
        `UPDATE proposals SET status = 'Accepted' WHERE proposal_id = $1`,
        [proposalId]
      );

      // Atomic operation 2: Reject all other pending proposals on this project
      await client.query(
        `UPDATE proposals
         SET status = 'Rejected'
         WHERE project_id = $1 AND proposal_id != $2 AND status = 'Pending'`,
        [proposal.project_id, proposalId]
      );

      // Atomic operation 3: Close the project to further bids
      await client.query(
        `UPDATE projects SET status = 'Accepted' WHERE project_id = $1`,
        [proposal.project_id]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        message: 'Proposal accepted successfully',
        proposalId: proposalId
      });
    } catch (error) {
      // Roll back all three changes if any step fails
      await client.query('ROLLBACK');
      console.error('Accept proposal error:', error);
      return res.status(500).json({ error: 'Server error while accepting proposal' });
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  }
);

// =============================================================================
// DELETE /api/proposals/:id
// Withdraw (delete) a contractor's own pending proposal.
// Access:  Contractor only, and only the proposal's author may withdraw it.
// Business rule: Only proposals with status = 'Pending' can be withdrawn.
//                Once accepted or rejected, the proposal is part of the
//                project's history and cannot be deleted.
// Returns: 200 OK on success.
// =============================================================================
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('Contractor'),
  validateId,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const proposalId = req.params.id;
    const contractorId = req.user.userId;

    try {
      // Fetch the proposal and verify it belongs to this contractor
      const proposalCheck = await pool.query(
        'SELECT * FROM proposals WHERE proposal_id = $1 AND contractor_id = $2',
        [proposalId, contractorId]
      );

      if (proposalCheck.rows.length === 0) {
        // Return 403 to avoid leaking whether another contractor's proposal exists
        return res.status(403).json({
          error: 'You do not have permission to delete this proposal'
        });
      }

      // Business rule: only pending proposals can be withdrawn
      if (proposalCheck.rows[0].status !== 'Pending') {
        return res.status(400).json({
          error: 'Only pending proposals can be withdrawn'
        });
      }

      // Delete the proposal from the database
      await pool.query(
        'DELETE FROM proposals WHERE proposal_id = $1 AND contractor_id = $2',
        [proposalId, contractorId]
      );

      return res.status(200).json({ message: 'Proposal withdrawn successfully' });
    } catch (error) {
      console.error('Delete proposal error:', error);
      return res.status(500).json({ error: 'Server error while deleting proposal' });
    }
  }
);

module.exports = router;
