const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const roleSchema = Joi.object({
  role: Joi.string().valid('admin', 'member').required(),
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user._id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Add role promotion endpoint — admin only (specific routes before generic)
router.put('/:id/role', adminAuth, validate(roleSchema), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.role = role;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

// Delete user endpoint — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
});

module.exports = router;
