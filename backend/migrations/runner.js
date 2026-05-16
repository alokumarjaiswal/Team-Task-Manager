'use strict';
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const { sync: globSync } = require('glob');

/**
 * Creates and returns an Umzug migration runner configured for the given
 * Sequelize instance. Uses SequelizeStorage to track applied migrations in
 * a `SequelizeMeta` table. Migration files are resolved via glob from this
 * directory (all [0-9]*.js files, i.e. numbered migration files).
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {Umzug}
 */
function createMigrationRunner(sequelize) {
  // Use glob.sync with forward slashes for cross-platform compatibility
  const pattern = path.join(__dirname, '[0-9]*.js').replace(/\\/g, '/');
  const migrationFiles = globSync(pattern);

  return new Umzug({
    migrations: migrationFiles.map((migPath) => ({
      name: path.basename(migPath),
      up: async ({ context }) => {
        const migration = require(migPath);
        return migration.up(context, sequelize.constructor);
      },
      down: async ({ context }) => {
        const migration = require(migPath);
        return migration.down(context, sequelize.constructor);
      },
    })),
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
}

module.exports = createMigrationRunner;
