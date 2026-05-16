const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./User');
const Task = require('./Task');

const ActivityLog = sequelize.define('ActivityLog', {
  _id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: { model: User, key: '_id' },
  },
  taskId: {
    type: DataTypes.INTEGER,
    references: { model: Task, key: '_id' },
    allowNull: true,
  }
}, { timestamps: true, updatedAt: false });

ActivityLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });
ActivityLog.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });

const Comment = sequelize.define('Comment', {
  _id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: { model: User, key: '_id' },
  },
  taskId: {
    type: DataTypes.INTEGER,
    references: { model: Task, key: '_id' },
  }
}, { timestamps: true, updatedAt: false });

Comment.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Task.hasMany(Comment, { foreignKey: 'taskId', onDelete: 'CASCADE' });

const Attachment = sequelize.define('Attachment', {
  _id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: { model: User, key: '_id' },
  },
  taskId: {
    type: DataTypes.INTEGER,
    references: { model: Task, key: '_id' },
  }
}, { timestamps: true, updatedAt: false });

Attachment.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Task.hasMany(Attachment, { foreignKey: 'taskId', onDelete: 'CASCADE' });

module.exports = { ActivityLog, Comment, Attachment };
