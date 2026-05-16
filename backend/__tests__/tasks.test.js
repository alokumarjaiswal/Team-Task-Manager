'use strict';

const request = require('supertest');
const { makeToken, createTestApp } = require('./helpers/setup');

describe('Task routes', () => {
  let app;
  let sequelize;

  // Test data
  let memberUser;
  let otherUser;
  let memberProject;
  let otherProject;
  let taskInMemberProject;
  let taskInOtherProject;

  const JWT_SECRET = 'test-secret';

  beforeAll(async () => {
    ({ app, sequelize } = await createTestApp());

    // Import models after createTestApp sets up the environment
    const User = require('../models/User');
    const { Project, ProjectMembers } = require('../models/Project');
    const Task = require('../models/Task');

    // Seed a member user (belongs to memberProject only)
    memberUser = await User.create({
      name: 'Member User',
      email: 'member@example.com',
      password: 'hashedpassword',
      role: 'member',
    });

    // Seed another user who owns otherProject but memberUser is NOT a member of
    otherUser = await User.create({
      name: 'Other User',
      email: 'other@example.com',
      password: 'hashedpassword',
      role: 'member',
    });

    // Seed two projects
    memberProject = await Project.create({
      name: 'Member Project',
      description: 'Project that memberUser belongs to',
      createdBy: otherUser._id,
    });

    otherProject = await Project.create({
      name: 'Other Project',
      description: 'Project that memberUser does NOT belong to',
      createdBy: otherUser._id,
    });

    // Add memberUser as a member of memberProject only
    await ProjectMembers.create({
      projectId: memberProject._id,
      userId: memberUser._id,
    });

    // Seed tasks
    taskInMemberProject = await Task.create({
      title: 'Task in Member Project',
      status: 'todo',
      projectId: memberProject._id,
      labels: '[]',
    });

    taskInOtherProject = await Task.create({
      title: 'Task in Other Project',
      status: 'todo',
      projectId: otherProject._id,
      labels: '[]',
    });
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  // ─── GET /api/tasks ───────────────────────────────────────────────────────

  describe('GET /api/tasks', () => {
    it('returns HTTP 401 when no token is provided', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .query({ projectId: memberProject._id });

      expect(res.status).toBe(401);
    });

    it('returns HTTP 403 when member requests tasks for a project they do not belong to', async () => {
      const token = makeToken(memberUser, JWT_SECRET);

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .query({ projectId: otherProject._id });

      expect(res.status).toBe(403);
    });

    it('returns HTTP 200 when member requests tasks for a project they belong to', async () => {
      const token = makeToken(memberUser, JWT_SECRET);

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .query({ projectId: memberProject._id });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── Property 2: Task list scoping ───────────────────────────────────────

  describe('Property 2: Task list scoping', () => {
    /**
     * Validates: Requirements 1.2
     *
     * For any authenticated non-admin user, every task returned by
     * GET /api/tasks (without a projectId filter) SHALL have a projectId
     * that belongs to a project of which the user is a member. No task
     * from a non-member project SHALL appear in the response.
     */
    it('GET /api/tasks (no projectId) returns only tasks from member projects', async () => {
      const token = makeToken(memberUser, JWT_SECRET);

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const returnedIds = res.body.map((t) => String(t._id));

      // Task from the member project MUST be present
      expect(returnedIds).toContain(String(taskInMemberProject._id));

      // Task from the non-member project MUST NOT be present
      expect(returnedIds).not.toContain(String(taskInOtherProject._id));

      // Exactly one task should be visible
      expect(res.body.length).toBe(1);
    });
  });

  // ─── PUT /api/tasks/:id ───────────────────────────────────────────────────

  describe('PUT /api/tasks/:id', () => {
    it('returns HTTP 403 when member attempts to update a task in a project they do not belong to', async () => {
      const token = makeToken(memberUser, JWT_SECRET);

      const res = await request(app)
        .put(`/api/tasks/${taskInOtherProject._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(403);
    });

    it('returns HTTP 200 when member updates a task in a project they belong to', async () => {
      const token = makeToken(memberUser, JWT_SECRET);

      const res = await request(app)
        .put(`/api/tasks/${taskInMemberProject._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Task Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Task Title');
    });
  });

  // ─── Property 1: Membership enforcement ──────────────────────────────────
  //
  // Validates: Requirements 1.1, 1.3, 1.4
  //
  // For both GET /api/tasks?projectId=X and PUT /api/tasks/:id, a non-member
  // user MUST receive HTTP 403 with { error: 'Forbidden' }, and a member user
  // MUST receive HTTP 200.

  describe('Property 1: Membership enforcement', () => {
    describe('GET /api/tasks?projectId=X', () => {
      it('non-member receives HTTP 403 with { error: "Forbidden" }', async () => {
        const token = makeToken(memberUser, JWT_SECRET);

        const res = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .query({ projectId: otherProject._id });

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Forbidden' });
      });

      it('member receives HTTP 200', async () => {
        const token = makeToken(memberUser, JWT_SECRET);

        const res = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${token}`)
          .query({ projectId: memberProject._id });

        expect(res.status).toBe(200);
      });
    });

    describe('PUT /api/tasks/:id', () => {
      it('non-member receives HTTP 403 with { error: "Forbidden" }', async () => {
        const token = makeToken(memberUser, JWT_SECRET);

        const res = await request(app)
          .put(`/api/tasks/${taskInOtherProject._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Attempted Update' });

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Forbidden' });
      });

      it('member receives HTTP 200', async () => {
        const token = makeToken(memberUser, JWT_SECRET);

        const res = await request(app)
          .put(`/api/tasks/${taskInMemberProject._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Property Test Update' });

        expect(res.status).toBe(200);
      });
    });
  });
});
