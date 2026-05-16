'use strict';

/**
 * Seed script — creates test admin and test member accounts.
 * Run once after a fresh database:
 *   node scripts/seed-test-users.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../models/index');
const createMigrationRunner = require('../migrations/runner');
const User = require('../models/User');

const TEST_USERS = [
  {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Admin1234!',
    role: 'admin',
  },
  {
    name: 'Test Member',
    email: 'member@test.com',
    password: 'Member1234!',
    role: 'member',
  },
];

async function seed() {
  await sequelize.authenticate();
  console.log('Database connected.');

  // Run any pending migrations so tables exist before inserting
  const umzug = createMigrationRunner(sequelize);
  await umzug.up();
  console.log('Migrations applied.');

  for (const u of TEST_USERS) {
    const existing = await User.findOne({ where: { email: u.email } });
    if (existing) {
      console.log(`  [skip] ${u.email} already exists`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ name: u.name, email: u.email, password: hashed, role: u.role });
    console.log(`  [created] ${u.role.padEnd(6)} — ${u.email}  /  ${u.password}`);
  }

  console.log('\nDone. Credentials:');
  console.log('  Admin  — admin@test.com   / Admin1234!');
  console.log('  Member — member@test.com  / Member1234!');
  await sequelize.close();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
