// Joi-based request validation middleware
// Usage: router.post('/', validate(taskSchema), handler)

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return res.status(422).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    }
    req.body = value;
    next();
  };
};

module.exports = validate;
