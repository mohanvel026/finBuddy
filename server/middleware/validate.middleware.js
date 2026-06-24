const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Check fields for each req location (body, query, params)
    for (const key of ['body', 'query', 'params']) {
      if (schema[key]) {
        const rules = schema[key];
        const data = req[key] || {};
        
        for (const [field, rule] of Object.entries(rules)) {
          const val = data[field];
          
          // Required validation
          if (rule.required && (val === undefined || val === null || val === '')) {
            errors.push(`${field} is required`);
            continue;
          }
          
          if (val !== undefined && val !== null && val !== '') {
            // Type validation
            if (rule.type === 'number') {
              const num = Number(val);
              if (isNaN(num)) {
                errors.push(`${field} must be a valid number`);
              } else {
                if (rule.min !== undefined && num < rule.min) {
                  errors.push(`${field} must be at least ${rule.min}`);
                }
                if (rule.max !== undefined && num > rule.max) {
                  errors.push(`${field} must be at most ${rule.max}`);
                }
              }
            } else if (rule.type === 'email') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(String(val))) {
                errors.push(`${field} must be a valid email address`);
              }
            } else if (rule.type === 'string') {
              if (typeof val !== 'string') {
                errors.push(`${field} must be a string`);
              } else {
                if (rule.minLength !== undefined && val.length < rule.minLength) {
                  errors.push(`${field} must be at least ${rule.minLength} characters`);
                }
                if (rule.maxLength !== undefined && val.length > rule.maxLength) {
                  errors.push(`${field} must be at most ${rule.maxLength} characters`);
                }
              }
            } else if (rule.type === 'boolean') {
              const isBool = val === true || val === false || val === 'true' || val === 'false';
              if (!isBool) {
                errors.push(`${field} must be a boolean`);
              }
            } else if (rule.type === 'array') {
              if (!Array.isArray(val)) {
                errors.push(`${field} must be an array`);
              }
            }
          }
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    
    next();
  };
};

module.exports = validate;
