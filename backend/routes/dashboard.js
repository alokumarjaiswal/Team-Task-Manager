const express = require('express');
const { Op } = require('sequelize');
const Task = require('../models/Task');
const { Project, ProjectMembers } = require('../models/Project');
const User = require('../models/User');
const { ActivityLog } = require('../models/Extras');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — aggregated dashboard data
router.get('/', auth, async (req, res) => {
  try {
    // Parse pagination params
    const rawLimit = parseInt(req.query.limit, 10);
    const rawOffset = parseInt(req.query.offset, 10);
    const limit = (!isNaN(rawLimit) && rawLimit > 0) ? Math.min(rawLimit, 100) : 20;
    const offset = (!isNaN(rawOffset) && rawOffset >= 0) ? rawOffset : 0;

    const isAdmin = req.user.role === 'admin';

    // For non-admin users, resolve the project IDs they are members of
    let projectIdFilter = null;
    if (!isAdmin) {
      const memberships = await ProjectMembers.findAll({
        where: { userId: req.user._id },
        attributes: ['projectId'],
      });
      projectIdFilter = memberships.map(m => m.projectId);
    }

    // Build where clauses
    const taskWhere = projectIdFilter !== null
      ? { projectId: { [Op.in]: projectIdFilter } }
      : {};
    const projectWhere = projectIdFilter !== null
      ? { _id: { [Op.in]: projectIdFilter } }
      : {};

    const [tasks, projects, users, activities] = await Promise.all([
      Task.findAll({
        where: taskWhere,
        limit,
        offset,
      }),
      Project.findAll({
        where: projectWhere,
        limit,
        offset,
      }),
      User.findAll({ attributes: { exclude: ['password'] } }),
      ActivityLog.findAll({
        include: [{ model: User, as: 'user', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      }),
    ]);

    // Aggregate task stats
    const tasksByStatus = {
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    // Tasks per project
    const tasksByProject = projects.map(p => ({
      projectId: p._id,
      projectName: p.name,
      taskCount: tasks.filter(t => t.projectId === p._id).length,
    }));

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;

    res.json({
      tasksByStatus,
      totalTasks: tasks.length,
      projectCount: projects.length,
      teamSize: users.length,
      overdueTasks,
      tasksByProject,
      recentActivity: activities,
    });
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
