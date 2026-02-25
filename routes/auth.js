const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

// =============================================================================
// VALIDATION RULES — Register
// Name, email format, minimum 6-char password, and role must be one of the
// two allowed values. Admins are created via DB seed, not self-registration.
// =============================================================================
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['Homeowner', 'Contractor'])
    .withMessage('Role must be Homeowner or Contractor')
];

// =============================================================================
// VALIDATION RULES — Login
// Only email format and presence of password are validated here.
// Credential correctness is checked against the database inside the handler.
// =============================================================================
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// =============================================================================
// POST /api/auth/register   — PUBLIC ROUTE
// Register a new Homeowner or Contractor account.
//
// Security notes:
//   - Password is hashed with bcrypt (10 salt rounds) before storage.
//     Plain-text passwords are NEVER persisted to the database.
//   - A generic 409 is returned for duplicate emails to prevent user enumeration.
//   - The returned user object does NOT include the password_hash field.
//
// Returns: 201 Created with JWT token (7-day expiry) and safe user object.
// =============================================================================
router.post('/register', registerValidation, async (req, res) => {
  // Surface all field-level validation errors in a single response
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Check whether this email is already registered
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      // 409 Conflict — email already in use
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash the password with bcrypt before storage (10 salt rounds is industry standard)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert the new user — RETURNING excludes password_hash for safety
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, role, is_verified, created_at`,
      [name, email, passwordHash, role]
    );

    const user = result.rows[0];

    // Sign a JWT with only non-sensitive identity data
    // Secret is stored in environment variable — never hardcoded
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    // 201 Created — new user account successfully created
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// =============================================================================
// POST /api/auth/login   — PUBLIC ROUTE
// Authenticate an existing user and issue a fresh JWT token.
//
// Security notes:
//   - bcrypt.compare() safely checks the supplied password against the stored
//     hash without ever decrypting it (bcrypt is a one-way function).
//   - Both "user not found" and "wrong password" return the SAME 401 message
//     to prevent user enumeration attacks.
//   - The returned user object does NOT include the password_hash field.
//
// Returns: 200 OK with JWT token (7-day expiry) and safe user object.
// =============================================================================
router.post('/login', loginValidation, async (req, res) => {
  // Surface all field-level validation errors in a single response
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Look up the user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // Same generic message for both "not found" and "wrong password"
    // — prevents an attacker from discovering which emails are registered
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Securely compare the supplied password against the stored bcrypt hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // 401 Unauthorized — same message as "not found" for security
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Sign a fresh JWT for the authenticated user
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token expires after 7 days
    );

    // 200 OK — user successfully authenticated
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
