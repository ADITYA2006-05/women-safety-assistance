const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

let Alert = {};

if (sequelize) {
  Alert = sequelize.define('Alert', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    userPhone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Accepted', 'Resolved', 'Cancelled'),
      defaultValue: 'Active'
    },
    location: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false
    },
    responderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: '_id'
      },
      onDelete: 'SET NULL'
    },
    responderName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    responderPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  });

  Alert.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Alert.belongsTo(User, { foreignKey: 'responderId', as: 'responder' });
}

module.exports = Alert;
