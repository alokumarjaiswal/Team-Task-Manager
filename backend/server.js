require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./models/index');
const createMigrationRunner = require('./migrations/runner');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const { ActivityLog } = require('./models/Extras');
const User = require('./models/User');
const Task = require('./models/Task');
const { Project, ProjectMembers } = require('./models/Project');
const { auth } = require('./middleware/auth');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();
app.set('trust proxy', 1); // Trust Railway's reverse proxy
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { socketId: socket.id });
  socket.on('disconnect', () => logger.debug('WebSocket client disconnected', { socketId: socket.id }));
});

// ── Security Middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);
app.use(compression({ threshold: 1024 }));

// ── Health Check ─────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// ── Safe Attachment Serving ──────────────────────────────
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
app.get('/api/attachments/:filename', auth, (req, res) => {
  const safe = path.basename(req.params.filename.replace(/\.\./g, '').replace(/[/\\]/g, ''));
  if (!safe) return res.status(400).json({ error: 'Invalid filename' });
  const filePath = path.join(UPLOADS_DIR, safe);
  if (!filePath.startsWith(UPLOADS_DIR + path.sep)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).json({ error: 'File not found' });
  });
});

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Activity Logs endpoint — scoped by role
app.get('/api/activities', auth, async (req, res) => {
  try {
    let activities;
    if (req.user.role === 'admin') {
      activities = await ActivityLog.findAll({
        include: [{ model: User, as: 'user', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
    } else {
      const memberships = await ProjectMembers.findAll({ where: { userId: req.user._id }, attributes: ['projectId'] });
      const projectIds = memberships.map(m => m.projectId);
      const memberTasks = await Task.findAll({ where: { projectId: projectIds }, attributes: ['_id'] });
      const taskIds = memberTasks.map(t => t._id);
      activities = await ActivityLog.findAll({
        where: { taskId: taskIds },
        include: [{ model: User, as: 'user', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
    }
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
  }
});

// ── Global Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
});

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// ── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Run pending migrations
  const umzug = createMigrationRunner(sequelize);
  await umzug.up();

  // 2. Ensure uploads directory exists
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // 3. Start listening
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
  });
};

if (require.main === module) {
  startServer().catch(err => {
    logger.error('Startup failed', { error: err.message });
    process.exit(1);
  });
}

module.exports = { app };
