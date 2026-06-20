const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

let Volunteer = {};

if (sequelize) {
  Volunteer = sequelize.define('Volunteer', {
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
    verificationStatus: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currentLocation: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: true
    }
  }, {
    timestamps: true,
    createdAt: false,
    updatedAt: 'updatedAt'
  });

  // Setup association
  Volunteer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasOne(Volunteer, { foreignKey: 'userId', as: 'volunteer' });
}

module.exports = Volunteer;
