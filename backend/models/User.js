const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let User = {};

if (sequelize) {
  User = sequelize.define('User', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('User', 'Volunteer', 'Admin'),
      defaultValue: 'User'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false // Only keep createdAt, no updatedAt for User schema to match MongoDB schema
  });
}

module.exports = User;
