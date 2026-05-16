// Centralized configuration — single source of truth for all env vars
// Fails fast if critical vars are missing in production

const parseOrigins = (value) => {
  if (!value) {
    return ['*'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // Database
  db: {
    // Auto-detect Postgres when a DATABASE_URL is present, allow override via DB_DIALECT
    dialect: process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'sqlite'),
    url: process.env.DATABASE_URL || null,
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'secret123',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // CORS
  frontendUrl: parseOrigins(process.env.FRONTEND_URL),

  // Email
  smtp: {
    host: process.env.SMTP_HOST || null,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
  },

  // Redis
  redisUrl: process.env.REDIS_URL || null,
};

// Validate critical vars in production
if (config.env === 'production') {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (config.jwt.secret === 'secret123') {
    throw new Error('JWT_SECRET must be changed from default in production!');
  }
}

module.exports = config;
