const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['User', 'Volunteer', 'Admin'], default: 'User' },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

let UserModel;
try {
  UserModel = mongoose.model('User');
} catch (e) {
  UserModel = mongoose.model('User', UserSchema);
}

module.exports = UserModel;
