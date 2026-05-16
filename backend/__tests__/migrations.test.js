'use strict';

/**
 * Property 4: Migration runner is idempotent
 * Validates: Requirements 2.7
 *
 * Calls umzug.up() twice against an in-memory SQLite instance and asserts:
 * 1. No error is thrown on either run
 * 2. All expected tables exist after the first run
 * 3. The schema is unchanged (same tables still exist) after the second run
 */

const { Sequelize } = require('sequelize');
const createMigrationRunner = require('../migrations/runner');

const EXPECTED_TABLES = [
  'Users',
  'Projects',
  'ProjectMembers',
  'Tasks',
  'ActivityLogs',
  'Comments',
  'Attachments',
];

let sequelize;
let umzug;

beforeAll(async () => {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });

  umzug = createMigrationRunner(sequelize);
});

afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
  }
});

/**
 * Helper: query sqlite_master to get the list of user-created table names.
 * Excludes the SequelizeMeta table managed by Umzug.
 */
async function getUserTables() {
  const [rows] = await sequelize.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'SequelizeMeta'"
  );
  return rows.map((r) => r.name);
}

describe('Property 4: Migration runner is idempotent', () => {
  it('first umzug.up() runs without error and creates all expected tables', async () => {
    await expect(umzug.up()).resolves.not.toThrow();

    const tables = await getUserTables();
    for (const expected of EXPECTED_TABLES) {
      expect(tables).toContain(expected);
    }
  });

  it('second umzug.up() runs without error (no-op) and schema is unchanged', async () => {
    // First run already happened in the previous test; run again
    await expect(umzug.up()).resolves.not.toThrow();

    const tables = await getUserTables();
    for (const expected of EXPECTED_TABLES) {
      expect(tables).toContain(expected);
    }

    // Exactly the expected tables should be present (no extras, no missing)
    expect(tables.sort()).toEqual([...EXPECTED_TABLES].sort());
  });
});
