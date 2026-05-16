const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const { Project } = require('./Project');
const User = require('./User');

const Task = sequelize.define('Task', {
  _id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('todo', 'in-progress', 'done'),
    defaultValue: 'todo',
  },
  dueDate: {
    type: DataTypes.DATE,
  },
  labels: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
  },
  milestone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Project,
      key: '_id',
    },
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: '_id',
    },
    allowNull: true,
  },
}, {
  timestamps: true,
});

Task.belongsTo(Project, { foreignKey: 'projectId' });
Project.hasMany(Task, { foreignKey: 'projectId' });

Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
User.hasMany(Task, { foreignKey: 'assignedTo' });

module.exports = Task;
