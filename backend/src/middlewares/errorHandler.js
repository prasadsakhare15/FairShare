import { isProduction } from '../utils/env.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (isProduction()) {
    console.error('Error:', status, message);
  } else {
    console.error('Error:', err);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Duplicate key: MySQL (ER_DUP_ENTRY) or PostgreSQL (23505)
  if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  // Foreign key violation: MySQL (ER_NO_REFERENCED_ROW_2) or PostgreSQL (23503)
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === '23503') {
    return res.status(404).json({ error: 'Referenced record not found' });
  }

  const payload = { error: isProduction() && status === 500 ? 'Internal server error' : message };
  if (!isProduction() && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
};
