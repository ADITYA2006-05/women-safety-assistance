const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

let SafetyResource = {};

if (sequelize) {
  SafetyResource = sequelize.define('SafetyResource', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('SafeZone', 'PoliceStation', 'Hospital'),
      allowNull: false
    },
    location: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  });
}

module.exports = SafetyResource;
