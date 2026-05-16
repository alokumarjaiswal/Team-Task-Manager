const rateLimit = require('express-rate-limit');
const isProduction = process.env.NODE_ENV === 'production';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // higher in dev to avoid local UI throttling
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
});

// Strict limiter for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: isProduction ? 5 : 20, // allow local retry/testing without lockouts
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Retry after 60 seconds.', code: 'AUTH_RATE_LIMIT' },
});

module.exports = { apiLimiter, authLimiter };
