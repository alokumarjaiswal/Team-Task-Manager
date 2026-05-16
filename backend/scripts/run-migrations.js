'use strict';
require('dotenv').config();
const sequelize = require('../models/index');
const createMigrationRunner = require('../migrations/runner');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const umzug = createMigrationRunner(sequelize);
    await umzug.up();
    console.log('Migrations applied successfully.');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

if (require.main === module) run();
