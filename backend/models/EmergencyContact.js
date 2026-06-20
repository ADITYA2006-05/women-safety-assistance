const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

let EmergencyContact = {};

if (sequelize) {
  EmergencyContact = sequelize.define('EmergencyContact', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    relationship: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isNotifiedBySOS: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  });

  EmergencyContact.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(EmergencyContact, { foreignKey: 'userId', as: 'emergencyContacts' });
}

module.exports = EmergencyContact;
