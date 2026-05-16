'use strict';

const jwt = require('jsonwebtoken');

/**
 * Signs a JWT token for use in tests.
 * @param {{ _id: string|number, role: string }} user
 * @param {string} secret
 * @returns {string} signed JWT
 */
function makeToken(user, secret) {
  return jwt.sign({ _id: user._id, role: user.role }, secret);
}

/**
 * Bootstraps the Express app against an in-memory SQLite database.
 * Sets all required environment variables before loading any modules so
 * that config/index.js and models/index.js pick up the test values.
 *
 * @returns {Promise<{ app: import('express').Application, sequelize: import('sequelize').Sequelize }>}
 */
async function createTestApp() {
  // Set env vars before requiring any app modules
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.DB_DIALECT = 'sqlite';
  process.env.DB_STORAGE = ':memory:';

  // Clear the require cache so each test suite gets a fresh instance
  // (important when multiple test files call createTestApp)
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('backend') || key.includes('server') || key.includes('models') || key.includes('config')) {
      delete require.cache[key];
    }
  });

  // Re-require after env vars are set
  const { app } = require('../../server');
  const sequelize = require('../../models/index');

  // Create all tables fresh
  await sequelize.sync({ force: true });

  return { app, sequelize };
}

module.exports = { makeToken, createTestApp };
