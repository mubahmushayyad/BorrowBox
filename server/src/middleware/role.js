const { ApiError } = require('./errorHandler');

// Usage: requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not logged in'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Not allowed'));
    next();
  };
}

module.exports = { requireRole };
