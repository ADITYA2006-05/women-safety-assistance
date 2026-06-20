const mongoose = require('mongoose');

const EmergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
  isNotifiedBySOS: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

let EmergencyContactModel;
try {
  EmergencyContactModel = mongoose.model('EmergencyContact');
} catch (e) {
  EmergencyContactModel = mongoose.model('EmergencyContact', EmergencyContactSchema);
}

module.exports = EmergencyContactModel;
