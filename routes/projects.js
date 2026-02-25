const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// =============================================================================
// HELPER: Validate that a route :id param is a positive integer.
// Prevents database errors (and misleading 500s) when a non-numeric ID like
// /projects/abc is supplied. Returns 400 Bad Request instead.
// =============================================================================
const validateId = param('id')
  .isInt({ min: 1 })
  .withMessage('ID must be a positive integer');

// =============================================================================
// VALIDATION RULES — shared between POST (create) and PUT (update).
// All five fields are required. Budget range logic (max >= min) is enforced
// inside the handler because cross-field rules are simpler as an if-statement.
// =============================================================================
const projectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('budget_min')
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget_max')
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  body('location').trim().notEmpty().withMessage('Location is required')
];

// =============================================================================
// POST /api/projects
// Create a new renovation project listing.
// Access:  Homeowner only (JWT required + role check via authorizeRole).
// Note:    homeowner_id is taken from the verified JWT payload — never from the
//          request body — so a user cannot assign a project to another owner.
// Returns: 201 Created with the full project row on success.
// =============================================================================
router.post(
  '/',
  authenticateToken,
  authorizeRole('Homeowner'),
  projectValidation,
  async (req, res) => {
    // Return all field-level validation errors at once
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, budget_min, budget_max, location } = req.body;
    const homeownerId = req.user.userId; // sourced from the verified JWT payload

    // Business rule: max budget must be at least equal to min budget
    if (parseFloat(budget_max) < parseFloat(budget_min)) {
      return res.status(400).json({
        error: 'Maximum budget must be greater than or equal to minimum budget'
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO projects (homeowner_id, title, description, budget_min, budget_max, location)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [homeownerId, title, description, budget_min, budget_max, location]
      );

      // 201 Created — correct HTTP status when a new resource is created
      return res.status(201).json({
        message: 'Project created successfully',
        project: result.rows[0]
      });
    } catch (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ error: 'Server error while creating project' });
    }
  }
);

// =============================================================================
// GET /api/projects
// List all projects currently accepting proposals (status = 'Open').
// Access:  Any authenticated user (homeowners browse, contractors find work).
// Joins with users so each project row includes the homeowner name and email.
// Returns: 200 OK with array of open projects and a total count.
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS homeowner_name, u.email AS homeowner_email
       FROM projects p
       JOIN users u ON p.homeowner_id = u.user_id
       WHERE p.status = 'Open'
       ORDER BY p.created_at DESC`
    );

    return res.status(200).json({
      projects: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ error: 'Server error while fetching projects' });
  }
});

// =============================================================================
// GET /api/projects/my
// Return all projects owned by the currently authenticated homeowner.
// Access:  Homeowner only.
// Includes a live proposal_count subquery so the homeowner can see at a glance
// how many contractors have bid on each project without a second request.
// Returns: 200 OK with the homeowner's projects and per-project proposal counts.
// =============================================================================
router.get(
  '/my',
  authenticateToken,
  authorizeRole('Homeowner'),
  async (req, res) => {
    const homeownerId = req.user.userId;

    try {
      const result = await pool.query(
        `SELECT p.*,
          (SELECT COUNT(*) FROM proposals WHERE project_id = p.project_id) AS proposal_count
         FROM projects p
         WHERE p.homeowner_id = $1
         ORDER BY p.created_at DESC`,
        [homeownerId]
      );

      return res.status(200).json({
        projects: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Get my projects error:', error);
      return res.status(500).json({ error: 'Server error while fetching projects' });
    }
  }
);

// =============================================================================
// GET /api/projects/:id
// Fetch a single project by its primary key.
// Access:  Any authenticated user.
// Returns: 200 OK with project + homeowner details, or 404 if not found.
// Note:    validateId rejects non-integer IDs (e.g. /projects/abc) with 400
//          before the query runs, preventing a confusing database error.
// =============================================================================
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  // Catch non-integer IDs and return a clear 400 instead of a 500
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const projectId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT p.*, u.name AS homeowner_name, u.email AS homeowner_email
       FROM projects p
       JOIN users u ON p.homeowner_id = u.user_id
       WHERE p.project_id = $1`,
      [projectId]
    );

    // 404 when no project with that ID exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.status(200).json({ project: result.rows[0] });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ error: 'Server error while fetching project' });
  }
});

// =============================================================================
// PUT /api/projects/:id
// Update an existing project's details.
// Access:  Homeowner only, and only the project's owner may make changes.
// Flow:
//   1. Validate all inputs (same rules as POST).
//   2. Confirm the project EXISTS → 404 if not found (separate from 403).
//   3. Confirm the requester OWNS the project → 403 if not.
//   4. Apply the update and return the refreshed project row.
// `status` is optional — COALESCE keeps the current value if omitted.
// =============================================================================
router.put(
  '/:id',
  authenticateToken,
  authorizeRole('Homeowner'),
  validateId,
  projectValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = req.params.id;
    const homeownerId = req.user.userId;
    const { title, description, budget_min, budget_max, location, status } = req.body;

    try {
      // Step 1: Does the project exist? Check before ownership to return correct status
      const existsCheck = await pool.query(
        'SELECT * FROM projects WHERE project_id = $1',
        [projectId]
      );

      if (existsCheck.rows.length === 0) {
        // 404 — the resource does not exist at all
        return res.status(404).json({ error: 'Project not found' });
      }

      // Step 2: Does the authenticated user own this project?
      if (existsCheck.rows[0].homeowner_id !== homeownerId) {
        // 403 — resource exists but this user has no right to modify it
        return res.status(403).json({
          error: 'You do not have permission to update this project'
        });
      }

      // Step 3: Apply the update; COALESCE preserves status if not supplied
      const result = await pool.query(
        `UPDATE projects
         SET title = $1, description = $2, budget_min = $3, budget_max = $4,
             location = $5, status = COALESCE($6, status)
         WHERE project_id = $7
         RETURNING *`,
        [title, description, budget_min, budget_max, location, status, projectId]
      );

      return res.status(200).json({
        message: 'Project updated successfully',
        project: result.rows[0]
      });
    } catch (error) {
      console.error('Update project error:', error);
      return res.status(500).json({ error: 'Server error while updating project' });
    }
  }
);

// =============================================================================
// DELETE /api/projects/:id
// Permanently remove a project and cascade-delete all its proposals.
// Access:  Homeowner only, and only the project's owner may delete it.
// Cascade: The DB schema uses ON DELETE CASCADE on the proposals FK so all
//          proposals are removed automatically when the project is deleted.
// Business rule: Deletion is blocked when any proposal has already been accepted
//                because that represents an agreed contract with a contractor.
// =============================================================================
router.delete(
  '/:id',
  authenticateToken,
  authorizeRole('Homeowner'),
  validateId,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = req.params.id;
    const homeownerId = req.user.userId;

    try {
      // Step 1: Confirm the project exists
      const existsCheck = await pool.query(
        'SELECT * FROM projects WHERE project_id = $1',
        [projectId]
      );

      if (existsCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Step 2: Confirm the requester owns this project
      if (existsCheck.rows[0].homeowner_id !== homeownerId) {
        return res.status(403).json({
          error: 'You do not have permission to delete this project'
        });
      }

      // Step 3: Block deletion if a proposal has already been accepted
      const acceptedProposals = await pool.query(
        'SELECT * FROM proposals WHERE project_id = $1 AND status = $2',
        [projectId, 'Accepted']
      );

      if (acceptedProposals.rows.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete project with accepted proposals'
        });
      }

      // Step 4: Delete the project — proposals cascade-delete via the FK constraint
      await pool.query('DELETE FROM projects WHERE project_id = $1', [projectId]);

      return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      return res.status(500).json({ error: 'Server error while deleting project' });
    }
  }
);

module.exports = router;
