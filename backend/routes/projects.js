const express = require('express');
const Joi = require('joi');
const { Project, ProjectMembers } = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const formatProject = (project) => {
  const projectJson = project.toJSON();
  return {
    _id: projectJson._id,
    name: projectJson.name,
    description: projectJson.description,
    createdBy: projectJson.createdBy,
    members: projectJson.members ? projectJson.members.map((member) => member._id) : [],
    createdAt: projectJson.createdAt,
    owner: projectJson.owner ? {
      _id: projectJson.owner._id,
      name: projectJson.owner.name,
      email: projectJson.owner.email,
    } : null,
  };
};

const projectCreateSchema = Joi.object({
  name: Joi.string().max(200).required(),
  description: Joi.string().max(2000).allow('', null).optional(),
  members: Joi.array().items(Joi.number().integer()).optional(),
});

const projectUpdateSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  members: Joi.array().items(Joi.number().integer()).optional(),
});

router.get('/', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      // Admins see all projects
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['_id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['_id', 'name', 'email'], through: { attributes: [] } }
        ]
      });
    } else {
      // Non-admins only see projects they are members of
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['_id', 'name', 'email'] },
          {
            model: User,
            as: 'members',
            attributes: ['_id', 'name', 'email'],
            through: { attributes: [] },
            where: { _id: req.user._id },
          }
        ]
      });
    }
    const formattedProjects = projects.map(p => {
      const pJson = p.toJSON();
      return {
        _id: pJson._id,
        name: pJson.name,
        description: pJson.description,
        createdBy: pJson.createdBy,
        members: pJson.members.map(m => m._id),
        createdAt: pJson.createdAt
      };
    });
    res.json(formattedProjects);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// GET /api/projects/:id — fetch a single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['_id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['_id', 'name', 'email'], through: { attributes: [] } },
      ],
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Non-admins must be a member of the project
    if (req.user.role !== 'admin') {
      const membership = await ProjectMembers.findOne({
        where: { projectId: project._id, userId: req.user._id },
      });
      if (!membership) return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(formatProject(project));
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.post('/', adminAuth, validate(projectCreateSchema), async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.create({ name, description, createdBy: req.user._id });
    
    // Add members if provided
    if (members && members.length > 0) {
      await project.addMembers(members);
    }

    const io = req.app.get('io');
    if (io) io.emit('projectCreated');
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.put('/:id', auth, validate(projectUpdateSchema), async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Only allow the project owner or an admin to update
    if (req.user.role !== 'admin' && String(project.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();

    if (members !== undefined) {
      await project.setMembers(members);
    }

    const io = req.app.get('io');
    if (io) io.emit('projectUpdated');

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Allow owner or admin to delete
    if (req.user.role !== 'admin' && String(project.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await project.destroy();

    const io = req.app.get('io');
    if (io) io.emit('projectDeleted');

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
