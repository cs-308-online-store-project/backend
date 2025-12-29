// src/middleware/auth.js
// Simple JWT authentication middleware used by protected routes.

const jwt = require("jsonwebtoken");

const extractToken = (req) => {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7).trim();
    }
    return authHeader.trim();
  }

  const token = req.headers?.["x-access-token"] || req.query?.token;
  if (typeof token === "string") {
    return token.trim();
  }

  return null;
};

const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

<<<<<<< Updated upstream
const requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(403).json({ message: "Role missing" });

  const allowed = roles.flat();
  if (!allowed.includes(role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};

module.exports = { requireAuth, requireRole };
=======
// Alias for requireAuth (for chat routes)
const authenticate = requireAuth;

// Optional auth - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
  } catch (err) {
    req.user = null;
  }
  
  return next();
};

module.exports = { requireAuth, authenticate, optionalAuth };
>>>>>>> Stashed changes
