const { errorResponse } = require('../utils/responseHandler');

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Access denied. Please log in.', 401);
  }
  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied. Admin privileges required.', 403);
  }
  next();
};

module.exports = { adminOnly };
