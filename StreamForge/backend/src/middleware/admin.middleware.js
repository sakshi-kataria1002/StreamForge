/**
 * adminOnly — must be used after `protect`.
 * Requires req.user.role === 'admin'. Returns 403 otherwise.
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }
  next();
};
