const { Sequelize } = require('sequelize');
const config = require('../config');

let sequelize;

if (config.db.dialect === 'postgres' && config.db.url) {
  sequelize = new Sequelize(config.db.url, {
    dialect: 'postgres',
    logging: config.db.logging,
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.db.storage,
    logging: config.db.logging,
  });
}

module.exports = sequelize;
