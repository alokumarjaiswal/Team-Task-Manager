'use strict';

const request = require('supertest');
const { makeToken, createTestApp } = require('./helpers/setup');

let app;
let sequelize;
let testUser;
let token;

beforeAll(async () => {
  ({ app, sequelize } = await createTestApp());

  // Import models after createTestApp sets up the environment
  const User = require('../models/User');
  const { Project } = require('../models/Project');
  const Task = require('../models/Task');

  // Seed a user
  testUser = await User.create({
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'hashedpassword',
    role: 'admin',
  });

  // Seed a project
  const project = await Project.create({
    name: 'Test Project',
    description: 'A project for testing',
    createdBy: testUser._id,
  });

  // Seed a task
  await Task.create({
    title: 'Test Task',
    description: 'A task for testing',
    status: 'todo',
    projectId: project._id,
  });

  token = makeToken(testUser, 'test-secret');
});

afterAll(async () => {
  if (sequelize) {
    await sequelize.close();
  }
});

/**
 * Property 5: Dashboard "To Do" count matches actual task status
 * Validates: Requirements 4.1, 4.2
 *
 * Seeds tasks with known status distributions and asserts that
 * tasksByStatus.todo equals the exact count of tasks with status === 'todo'.
 */
describe('Property 5: tasksByStatus.todo correctness', () => {
  beforeAll(async () => {
    const { Project } = require('../models/Project');
    const Task = require('../models/Task');

    // The outer beforeAll already seeded 1 todo task in "Test Project".
    // Seed 2 more todo tasks, 1 in-progress, and 1 done to verify exact counts.
    const project = await Project.findOne({ where: { name: 'Test Project' } });

    await Task.create({
      title: 'Todo Task 2',
      description: 'Second todo task',
      status: 'todo',
      projectId: project._id,
    });

    await Task.create({
      title: 'Todo Task 3',
      description: 'Third todo task',
      status: 'todo',
      projectId: project._id,
    });

    await Task.create({
      title: 'In Progress Task',
      description: 'An in-progress task',
      status: 'in-progress',
      projectId: project._id,
    });

    await Task.create({
      title: 'Done Task',
      description: 'A completed task',
      status: 'done',
      projectId: project._id,
    });
  });

  it('tasksByStatus.todo equals exact count of todo tasks (1 from outer setup + 2 new = 3)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tasksByStatus.todo).toBe(3);
  });

  it('tasksByStatus["in-progress"] equals exact count of in-progress tasks (1)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tasksByStatus['in-progress']).toBe(1);
  });

  it('tasksByStatus.done equals exact count of done tasks (1)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tasksByStatus.done).toBe(1);
  });

  it('total task count reflects all seeded tasks (5 total)', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // 1 original todo + 2 new todo + 1 in-progress + 1 done = 5
    expect(res.body.totalTasks).toBe(5);
  });
});

describe('GET /api/dashboard', () => {
  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('returns 200 with dashboard data for an authenticated user', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('response contains tasksByStatus key', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('tasksByStatus');
  });

  it('response contains totalTasks key', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('totalTasks');
  });

  it('response contains projectCount key', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('projectCount');
  });

  it('response contains teamSize key', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('teamSize');
  });

  it('reflects seeded data correctly', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBeGreaterThanOrEqual(1);
    expect(res.body.projectCount).toBeGreaterThanOrEqual(1);
    expect(res.body.teamSize).toBeGreaterThanOrEqual(1);
    expect(res.body.tasksByStatus).toMatchObject({
      todo: expect.any(Number),
      'in-progress': expect.any(Number),
      done: expect.any(Number),
    });
  });
});
