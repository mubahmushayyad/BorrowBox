const { ApiError } = require('./errorHandler');

// Small dependency-free validator: fields = { name: { required, type, min, max } }
function validate(fields) {
  return (req, res, next) => {
    const errors = [];
    for (const [key, rule] of Object.entries(fields)) {
      const value = req.body[key];
      const present = value !== undefined && value !== null && value !== '';

      if (rule.required && !present) {
        errors.push(`${key} is required`);
        continue;
      }
      if (!present) continue;

      if (rule.type === 'number' && Number.isNaN(Number(value))) {
        errors.push(`${key} must be a number`);
      }
      if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${key} must be a valid email`);
      }
      if (rule.type === 'date' && Number.isNaN(Date.parse(value))) {
        errors.push(`${key} must be a valid date`);
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
      }
      if (rule.min !== undefined && String(value).length < rule.min) {
        errors.push(`${key} must be at least ${rule.min} characters`);
      }
    }
    if (errors.length) return next(new ApiError(400, errors.join('; ')));
    next();
  };
}

module.exports = { validate };
