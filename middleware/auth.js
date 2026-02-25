const jwt = require('jsonwebtoken');

// =============================================================================
// MIDDLEWARE: authenticateToken
// Verifies the JWT supplied in the Authorization header on every protected route.
//
// Expected header format:  Authorization: Bearer <token>
//
// On success: decodes the token payload and attaches it to req.user so that
//             downstream route handlers can read { userId, email, role }.
// On failure:
//   401 — no token provided (user is not logged in)
//   403 — token is present but invalid or expired
// =============================================================================
const authenticateToken = (req, res, next) => {
  // Extract the raw Authorization header value (may be undefined if not sent)
  const authHeader = req.headers['authorization'];

  // Token follows the "Bearer " prefix; split on space and take the second part
  const token = authHeader && authHeader.split(' ')[1];

  // If no token is present the user has not authenticated at all — 401
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // jwt.verify throws if the token is expired, tampered with, or signed
    // with a different secret — all of those result in a 403 response below
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload to the request so route handlers can read
    // req.user.userId, req.user.email, req.user.role without re-decoding
    req.user = decoded;

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    // Token exists but is invalid or expired — 403 Forbidden
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// =============================================================================
// MIDDLEWARE FACTORY: authorizeRole(...allowedRoles)
// Returns a middleware function that checks whether the authenticated user's
// role is included in the list of roles permitted for this route.
//
// Usage:  authorizeRole('Homeowner')           — single role
//         authorizeRole('Admin', 'Homeowner')  — multiple allowed roles
//
// Must be called AFTER authenticateToken so that req.user is already populated.
// On failure:
//   401 — req.user is missing (authenticateToken was not applied first)
//   403 — user is authenticated but their role is not in the allowed list
// =============================================================================
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Guard against being called without authenticateToken running first
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Check if the user's role is in the list of permitted roles for this route
    if (!allowedRoles.includes(req.user.role)) {
      // 403 Forbidden — authenticated but not authorized for this action
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    // Role is allowed — continue to the route handler
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
