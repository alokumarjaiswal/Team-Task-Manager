const express = require('express');
const multer = require('multer');
const path = require('path');
const Joi = require('joi');
const Task = require('../models/Task');
const { Op } = require('sequelize');
const { Project, ProjectMembers } = require('../models/Project');
const User = require('../models/User');
const { ActivityLog, Comment, Attachment } = require('../models/Extras');
const { auth, adminAuth, requireProjectMember } = require('../middleware/auth');
const validate = require('../middleware/validate');
const sendEmail = require('../utils/email');

const taskCreateSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  status: Joi.string().valid('todo', 'in-progress', 'done').optional(),
  projectId: Joi.number().integer().required(),
  assignedTo: Joi.number().integer().allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  labels: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(80)),
    Joi.string().max(500),
  ).optional(),
  milestone: Joi.string().max(200).allow('', null).optional(),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  status: Joi.string().valid('todo', 'in-progress', 'done').optional(),
  projectId: Joi.number().integer().optional(),
  assignedTo: Joi.number().integer().allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  labels: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(80)),
    Joi.string().max(500),
  ).optional(),
  milestone: Joi.string().max(200).allow('', null).optional(),
});

const commentSchema = Joi.object({
  text: Joi.string().min(1).max(5000).required(),
});

const router = express.Router();

// Whitelisted MIME types for file uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]);

/**
 * Sanitize a filename: strip unsafe characters from the basename,
 * keeping only alphanumeric, hyphens, underscores, and dots,
 * then prepend a timestamp to ensure uniqueness.
 */
function sanitizeFilename(original) {
  const basename = path.basename(original);
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}_${safe}`;
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, sanitizeFilename(file.originalname));
  }
});

const fileFilter = function (req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

const logActivity = async (action, details, userId, taskId = null) => {
  await ActivityLog.create({ action, details, userId, taskId });
};

const parseLabels = (value) => {
  if (Array.isArray(value)) {
    return value.map((label) => String(label).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean);
  }

  return [];
};

const serializeTask = (task) => {
  const taskJson = task.toJSON();
  let labels = [];

  try {
    const parsedLabels = JSON.parse(taskJson.labels || '[]');
    labels = Array.isArray(parsedLabels) ? parsedLabels : [];
  } catch {
    labels = [];
  }

  return {
    ...taskJson,
    labels,
    milestone: taskJson.milestone || '',
  };
};

router.post('/', adminAuth, validate(taskCreateSchema), async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status, dueDate, labels, milestone } = req.body;
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo,
      status: status || 'todo',
      dueDate,
      labels: JSON.stringify(parseLabels(labels)),
      milestone: milestone || null,
    });
    
    await logActivity('Task Created', `Task "${title}" created`, req.user._id, task._id);

    // Email notification
    if (assignedTo) {
      const user = await User.findByPk(assignedTo);
      if (user) {
        await sendEmail(user.email, 'New Task Assigned', `You have been assigned a new task: ${title}`);
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.status(201).json(serializeTask(task));
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.get('/', auth, requireProjectMember(req => req.query.projectId || null), async (req, res) => {
  try {
    const { projectId } = req.query;
    let whereClause;
    if (projectId) {
      whereClause = { projectId };
    } else if (req.user.role !== 'admin') {
      // Filter to tasks belonging to projects the user is a member of
      const memberships = await ProjectMembers.findAll({
        where: { userId: req.user._id },
        attributes: ['projectId'],
      });
      const memberProjectIds = memberships.map(m => m.projectId);
      whereClause = { projectId: { [Op.in]: memberProjectIds } };
    } else {
      whereClause = {};
    }
    const tasks = await Task.findAll({ 
      where: whereClause,
      include: [
        { model: Comment },
        { model: Attachment }
      ]
    });
    res.json(tasks.map(serializeTask));
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Pre-load middleware: fetch task by id and attach to req.task
const loadTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    req.task = task;
    next();
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

router.put('/:id', auth, loadTask, requireProjectMember(req => req.task.projectId), validate(taskUpdateSchema), async (req, res) => {
  try {
    const { title, description, status, assignedTo, dueDate, labels, milestone } = req.body;
    const task = req.task;
    
    if (status && status !== task.status) {
      await logActivity('Status Changed', `Task status changed from ${task.status} to ${status}`, req.user._id, task._id);
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (labels !== undefined) task.labels = JSON.stringify(parseLabels(labels));
    if (milestone !== undefined) task.milestone = milestone || null;
    
    if (assignedTo !== undefined && assignedTo !== task.assignedTo) {
      task.assignedTo = assignedTo;
      if (assignedTo) {
        const user = await User.findByPk(assignedTo);
        if (user) {
          await sendEmail(user.email, 'Task Re-assigned', `You have been re-assigned to task: ${task.title}`);
        }
      }
    }
    
    await task.save();

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.json(serializeTask(task));
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await logActivity('Task Deleted', `Task "${task.title}" deleted`, req.user._id);
    await task.destroy();

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Comments
router.post('/:id/comments', auth, validate(commentSchema), async (req, res) => {
  try {
    const comment = await Comment.create({
      text: req.body.text,
      userId: req.user._id,
      taskId: req.params.id
    });
    await logActivity('Comment Added', 'Added a comment', req.user._id, req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Attachments
router.post('/:id/attachments', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
// Store only the sanitized filename (not full path) to prevent path traversal
    const attachment = await Attachment.create({
      filename: req.file.originalname,
      path: req.file.filename,
      userId: req.user._id,
      taskId: req.params.id
    });
    await logActivity('File Attached', `Attached file ${req.file.originalname}`, req.user._id, req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('taskUpdated');

    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Multer error handler — catches file type and size rejections from the upload middleware
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
