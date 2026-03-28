const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Verifies JWT access token and attaches req.user
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_MISSING', message: 'Authorization token is required' },
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' },
      });
    }

    req.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_INVALID', message: 'Invalid or expired access token' },
    });
  }
};

// Attaches req.user if token present, but does not block unauthenticated requests
exports.optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = { id: user._id, name: user.name, email: user.email, role: user.role };
  } catch {
    // silently ignore invalid tokens
  }
  next();
};
