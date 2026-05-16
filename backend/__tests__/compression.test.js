'use strict';

/**
 * Property 7: Compression applied to large JSON responses
 * Validates: Requirements 3.4
 *
 * Assert that a response with a JSON body larger than 1 KB, when the client
 * sends `Accept-Encoding: gzip`, includes `Content-Encoding: gzip`.
 */

const request = require('supertest');
const { makeToken, createTestApp } = require('./helpers/setup');

let app;
let sequelize;
let adminToken;

beforeAll(async () => {
  ({ app, sequelize } = await createTestApp());

  const User = require('../models/User');

  // Create an admin user to authenticate with
  const adminUser = await User.create({
    name: 'Admin User For Compression Test',
    email: 'admin-compression@example.com',
    password: 'hashedpassword',
    role: 'admin',
  });

  adminToken = makeToken(adminUser, 'test-secret');

  // Seed 30 users with long names and emails so that GET /api/users
  // returns a response body well above the 1 KB compression threshold.
  const userPromises = [];
  for (let i = 0; i < 30; i++) {
    userPromises.push(
      User.create({
        name: `Seeded User Number ${i} with a sufficiently long name to inflate the JSON payload size`,
        email: `seeded-user-number-${i}-with-long-email-address-for-compression-test@example.com`,
        password: 'hashedpassword',
        role: 'member',
      })
    );
  }
  await Promise.all(userPromises);
}, 30000);

afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
  }
});

describe('Property 7: Compression applied to large JSON responses', () => {
  it('returns Content-Encoding: gzip for a large JSON response when Accept-Encoding: gzip is sent', async () => {
    // Disable supertest's automatic decompression by using buffer mode so we
    // can inspect the raw Content-Encoding header before any client-side decoding.
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Accept-Encoding', 'gzip')
      .buffer(true)
      .parse((res, callback) => {
        // Collect raw bytes without decompressing so the header is preserved
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    // The response must be successful
    expect(res.status).toBe(200);

    // The server must have applied gzip compression
    expect(res.headers['content-encoding']).toBe('gzip');
  });

  it('response body is larger than 1 KB before compression (confirming threshold is met)', async () => {
    // Fetch without Accept-Encoding to get the uncompressed body size
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Accept-Encoding', 'identity'); // explicitly request no compression

    expect(res.status).toBe(200);

    const bodyLength = JSON.stringify(res.body).length;
    // The uncompressed JSON must exceed 1024 bytes for compression to trigger
    expect(bodyLength).toBeGreaterThan(1024);
  });
});
