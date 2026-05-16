'use strict';

/**
 * Property 6: Cache-Control header present on all attachment responses
 * Validates: Requirements 3.3
 *
 * For any valid authenticated GET to /api/attachments/:filename where the file
 * exists, the response SHALL include a Cache-Control header with the value
 * "public, max-age=31536000, immutable".
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { makeToken, createTestApp } = require('./helpers/setup');

const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
const TEST_FILENAME = 'test-attachment.txt';
const TEST_FILE_PATH = path.join(UPLOADS_DIR, TEST_FILENAME);

describe('Attachment route — Cache-Control header (Property 6)', () => {
  let app;
  let sequelize;
  let memberUser;

  const JWT_SECRET = 'test-secret';

  beforeAll(async () => {
    ({ app, sequelize } = await createTestApp());

    // Ensure uploads directory exists
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    // Create a real test file in the uploads directory
    fs.writeFileSync(TEST_FILE_PATH, 'test attachment content for cache-control header test');

    // Create a user to authenticate with
    const User = require('../models/User');
    memberUser = await User.create({
      name: 'Attachment Test User',
      email: 'attachment-test@example.com',
      password: 'hashedpassword',
      role: 'member',
    });
  }, 30000);

  afterAll(async () => {
    // Clean up the test file
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
    }

    if (sequelize) {
      await sequelize.close();
    }
  });

  it('returns Cache-Control: public, max-age=31536000, immutable for an existing attachment', async () => {
    const token = makeToken(memberUser, JWT_SECRET);

    const res = await request(app)
      .get(`/api/attachments/${TEST_FILENAME}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('returns HTTP 401 when no token is provided', async () => {
    const res = await request(app)
      .get(`/api/attachments/${TEST_FILENAME}`);

    expect(res.status).toBe(401);
  });

  it('returns HTTP 404 for a non-existent file (no Cache-Control header required)', async () => {
    const token = makeToken(memberUser, JWT_SECRET);

    const res = await request(app)
      .get('/api/attachments/nonexistent-file-xyz.txt')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  /**
   * Property test: Cache-Control header is present on ALL valid attachment responses,
   * regardless of the filename used (as long as the file exists).
   *
   * We generate multiple filenames, create each file, request it, and assert the header.
   */
  it('Cache-Control header is present for all valid filenames (property across multiple files)', async () => {
    const token = makeToken(memberUser, JWT_SECRET);

    const testFilenames = [
      'property-test-1.txt',
      'property-test-2.txt',
      'property-test-3.txt',
    ];

    const createdFiles = [];

    try {
      // Create all test files
      for (const filename of testFilenames) {
        const filePath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(filePath, `content for ${filename}`);
        createdFiles.push(filePath);
      }

      // Assert Cache-Control header for each file
      for (const filename of testFilenames) {
        const res = await request(app)
          .get(`/api/attachments/${filename}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
      }
    } finally {
      // Clean up all created files
      for (const filePath of createdFiles) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  });
});
