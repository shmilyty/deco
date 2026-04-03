const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

const requireAuth = (req, res, next) => {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: '请先登录' });
    }
    next();
  });
};

const checkTreeAccess = (tree, user) => {
  if (user && user.isAdmin) return true;
  if (tree.isPublic) return true;
  if (tree.isAccessible) return true;
  if (user && user.id === tree.ownerId) return true;
  return false;
};

module.exports = { optionalAuth, requireAuth, checkTreeAccess };
