const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to require admin or employee role
 * Verifies JWT token and checks that user has admin or employee role
 */
function requireAdmin(req, res, next) {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[requireAdmin] No authorization header');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract token
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('[requireAdmin] No token in authorization header');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin or employee role
    const userRole = decodedToken.role || 'user';
    if (userRole !== 'admin' && userRole !== 'employee') {
      console.log(`[requireAdmin] Access denied - User ${decodedToken.username} has role: ${userRole}`);
      return res.status(403).json({ 
        message: 'Forbidden: Admin or employee role required',
        userRole: userRole
      });
    }

    // Attach user info to request
    req.user = decodedToken;
    console.log(`[requireAdmin] Access granted - User ${decodedToken.username} with role: ${userRole}`);
    next();
  } catch (err) {
    console.error('[requireAdmin] Token verification failed:', err.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = requireAdmin;
