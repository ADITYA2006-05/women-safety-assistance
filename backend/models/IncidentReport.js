const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Alert = require('./Alert');

let IncidentReport = {};

if (sequelize) {
  IncidentReport = sequelize.define('IncidentReport', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    alertId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Alerts',
        key: '_id'
      },
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: '_id'
      },
      onDelete: 'CASCADE'
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    volunteerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: '_id'
      },
      onDelete: 'SET NULL'
    },
    volunteerName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      defaultValue: 'Medium'
    }
  }, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  });

  IncidentReport.belongsTo(Alert, { foreignKey: 'alertId', as: 'alert' });
  IncidentReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  IncidentReport.belongsTo(User, { foreignKey: 'volunteerId', as: 'volunteer' });
}

module.exports = IncidentReport;
