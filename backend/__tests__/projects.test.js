'use strict';

const request = require('supertest');
const { makeToken, createTestApp } = require('./helpers/setup');

describe('Projects API', () => {
  let app;
  let sequelize;
  let memberUser;
  let adminUser;
  let memberProject;   // project that memberUser belongs to
  let otherProject;    // project that memberUser does NOT belong to

  beforeAll(async () => {
    ({ app, sequelize } = await createTestApp());

    const User = require('../models/User');
    const { Project, ProjectMembers } = require('../models/Project');
    const bcrypt = require('bcryptjs');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Seed users
    memberUser = await User.create({
      name: 'Member User',
      email: 'member@example.com',
      password: hashedPassword,
      role: 'member',
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });

    // Seed projects
    memberProject = await Project.create({
      name: 'Member Project',
      description: 'A project the member belongs to',
      createdBy: adminUser._id,
    });

    otherProject = await Project.create({
      name: 'Other Project',
      description: 'A project the member does NOT belong to',
      createdBy: adminUser._id,
    });

    // Add memberUser to memberProject only
    await ProjectMembers.create({
      projectId: memberProject._id,
      userId: memberUser._id,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ── GET /api/projects ──────────────────────────────────────────────────────

  describe('GET /api/projects', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
    });

    it('returns only the projects the member belongs to', async () => {
      const token = makeToken(memberUser, 'test-secret');

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const ids = res.body.map((p) => p._id);

      // Should include the project the member belongs to
      expect(ids).toContain(memberProject._id);

      // Should NOT include the project the member does not belong to
      expect(ids).not.toContain(otherProject._id);
    });

    it('returns all projects for an admin user', async () => {
      const token = makeToken(adminUser, 'test-secret');

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const ids = res.body.map((p) => p._id);
      expect(ids).toContain(memberProject._id);
      expect(ids).toContain(otherProject._id);
    });
  });

  // ── Property 3: Project list scoping ──────────────────────────────────────
  // Validates: Requirements 1.5, 1.6, 1.7

  describe('Property 3: Project list scoping', () => {
    it('returns exactly one project for a member user (only their member project)', async () => {
      const token = makeToken(memberUser, 'test-secret');

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // The member belongs to exactly one project — the list must be exactly length 1
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(memberProject._id);
    });

    it('returns exactly two projects for an admin user (all seeded projects)', async () => {
      const token = makeToken(adminUser, 'test-secret');

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Admin sees all projects — exactly the two seeded in beforeAll
      expect(res.body.length).toBe(2);

      const ids = res.body.map((p) => p._id);
      expect(ids).toContain(memberProject._id);
      expect(ids).toContain(otherProject._id);
    });
  });

  // ── POST /api/projects ─────────────────────────────────────────────────────

  describe('POST /api/projects', () => {
    it('returns 403 when a non-admin user tries to create a project', async () => {
      const token = makeToken(memberUser, 'test-secret');

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Unauthorized Project' });

      expect(res.status).toBe(403);
    });

    it('returns 201 when an admin user creates a project', async () => {
      const token = makeToken(adminUser, 'test-secret');

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Admin Project', description: 'Created by admin' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('New Admin Project');
    });
  });
});
