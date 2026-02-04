const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Validation rules
const projectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('budget_min').isFloat({ min: 0 }).withMessage('Minimum budget must be a positive number'),
  body('budget_max').isFloat({ min: 0 }).withMessage('Maximum budget must be a positive number'),
  body('location').trim().notEmpty().withMessage('Location is required')
];

// POST /api/projects - Create new project (Homeowner only)
router.post('/', authenticateToken, authorizeRole('Homeowner'), projectValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, budget_min, budget_max, location } = req.body;
  const homeownerId = req.user.userId;

  // Validate budget range
  if (parseFloat(budget_max) < parseFloat(budget_min)) {
    return res.status(400).json({ error: 'Maximum budget must be greater than or equal to minimum budget' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO projects (homeowner_id, title, description, budget_min, budget_max, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [homeownerId, title, description, budget_min, budget_max, location]
    );

    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error while creating project' });
  }
});

// GET /api/projects - List all open projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as homeowner_name, u.email as homeowner_email
       FROM projects p
       JOIN users u ON p.homeowner_id = u.user_id
       WHERE p.status = 'Open'
       ORDER BY p.created_at DESC`
    );

    res.json({
      projects: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error while fetching projects' });
  }
});

// GET /api/projects/my - Get current user's projects
router.get('/my', authenticateToken, authorizeRole('Homeowner'), async (req, res) => {
  const homeownerId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM proposals WHERE project_id = p.project_id) as proposal_count
       FROM projects p
       WHERE p.homeowner_id = $1
       ORDER BY p.created_at DESC`,
      [homeownerId]
    );

    res.json({
      projects: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ error: 'Server error while fetching projects' });
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', authenticateToken, async (req, res) => {
  const projectId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT p.*, u.name as homeowner_name, u.email as homeowner_email
       FROM projects p
       JOIN users u ON p.homeowner_id = u.user_id
       WHERE p.project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error while fetching project' });
  }
});

// PUT /api/projects/:id - Update project (Owner only)
router.put('/:id', authenticateToken, authorizeRole('Homeowner'), projectValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const projectId = req.params.id;
  const homeownerId = req.user.userId;
  const { title, description, budget_min, budget_max, location, status } = req.body;

  try {
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1 AND homeowner_id = $2',
      [projectId, homeownerId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to update this project' });
    }

    // Update project
    const result = await pool.query(
      `UPDATE projects 
       SET title = $1, description = $2, budget_min = $3, budget_max = $4, location = $5, status = COALESCE($6, status)
       WHERE project_id = $7 AND homeowner_id = $8
       RETURNING *`,
      [title, description, budget_min, budget_max, location, status, projectId, homeownerId]
    );

    res.json({
      message: 'Project updated successfully',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error while updating project' });
  }
});

// DELETE /api/projects/:id - Delete project (Owner only, no accepted proposals)
router.delete('/:id', authenticateToken, authorizeRole('Homeowner'), async (req, res) => {
  const projectId = req.params.id;
  const homeownerId = req.user.userId;

  try {
    // Check ownership
    const ownerCheck = await pool.query(
      'SELECT * FROM projects WHERE project_id = $1 AND homeowner_id = $2',
      [projectId, homeownerId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to delete this project' });
    }

    // Check if project has accepted proposals
    const acceptedProposals = await pool.query(
      'SELECT * FROM proposals WHERE project_id = $1 AND status = $2',
      [projectId, 'Accepted']
    );

    if (acceptedProposals.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete project with accepted proposals' });
    }

    // Delete project (proposals will cascade delete)
    await pool.query(
      'DELETE FROM projects WHERE project_id = $1 AND homeowner_id = $2',
      [projectId, homeownerId]
    );

    res.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error while deleting project' });
  }
});

module.exports = router;
