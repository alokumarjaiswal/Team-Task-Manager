const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./User');

const Project = sequelize.define('Project', {
  _id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: '_id',
    },
  },
}, {
  timestamps: true,
});

Project.belongsTo(User, { as: 'owner', foreignKey: 'createdBy' });
User.hasMany(Project, { foreignKey: 'createdBy' });

// Many-to-many for members
const ProjectMembers = sequelize.define('ProjectMembers', {
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Project,
      key: '_id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: '_id'
    }
  }
}, { timestamps: false });

Project.belongsToMany(User, { as: 'members', through: ProjectMembers, foreignKey: 'projectId', otherKey: 'userId' });
User.belongsToMany(Project, { as: 'memberOf', through: ProjectMembers, foreignKey: 'userId', otherKey: 'projectId' });

module.exports = { Project, ProjectMembers };
