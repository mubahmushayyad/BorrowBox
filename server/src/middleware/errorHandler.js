// Central error handler. Controllers call next(err) or throw inside async
// handlers wrapped with asyncHandler below.

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, data: null, message: 'Route not found' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    success: false,
    data: null,
    message: err.message || 'Something went wrong',
  });
}

module.exports = { asyncHandler, ApiError, notFoundHandler, errorHandler };
