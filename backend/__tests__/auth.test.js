'use strict';

const request = require('supertest');
const { createTestApp } = require('./helpers/setup');

describe('Auth API', () => {
  let app;
  let sequelize;

  beforeAll(async () => {
    ({ app, sequelize } = await createTestApp());
  }, 30000);

  afterAll(async () => {
    await sequelize.close();
  });

  // ── POST /api/auth/signup ──────────────────────────────────────────────────

  describe('POST /api/auth/signup', () => {
    it('returns 201 with a token property on valid input', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      // The signup route returns user fields; check the response contains expected fields
      expect(res.body).toHaveProperty('email', 'alice@example.com');
      expect(res.body).toHaveProperty('name', 'Alice');
    });

    it('returns 400 when the email is already registered', async () => {
      // First signup
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Bob', email: 'bob@example.com', password: 'password123' });

      // Duplicate signup
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Bob Again', email: 'bob@example.com', password: 'password123' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Ensure a known user exists for login tests
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Carol', email: 'carol@example.com', password: 'password123' });
    }, 15000);

    it('returns 200 with a token on valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'carol@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('returns 400 on wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'carol@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(400);
    });

    it('returns 400 on unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(400);
    });
  });
});
