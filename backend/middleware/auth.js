const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ProjectMembers } = require('../models/Project');
const config = require('../config');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded._id);
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please log in again.' });
    }
    req.user = decoded; // { _id, role }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

/**
 * Middleware factory that checks the authenticated user is a member of the
 * target project (or is an admin, which bypasses the check).
 *
 * @param {(req: Request) => number|string} getProjectId
 *   A function that receives the Express request and returns the project ID to
 *   check membership against.
 */
const requireProjectMember = (getProjectId) => async (req, res, next) => {
  // Admins have unrestricted access
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  const projectId = getProjectId(req);

  // If no projectId is provided, skip the membership check — the route handler
  // is responsible for scoping the results to the user's member projects.
  if (!projectId) {
    return next();
  }

  const membership = await ProjectMembers.findOne({
    where: { projectId, userId: req.user._id },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

module.exports = { auth, adminAuth, requireProjectMember };
