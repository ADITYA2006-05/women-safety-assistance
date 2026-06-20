const mongoose = require('mongoose');

const SafetyResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['SafeZone', 'PoliceStation', 'Hospital'], required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

SafetyResourceSchema.index({ location: '2dsphere' });

let SafetyResourceModel;
try {
  SafetyResourceModel = mongoose.model('SafetyResource');
} catch (e) {
  SafetyResourceModel = mongoose.model('SafetyResource', SafetyResourceSchema);
}

module.exports = SafetyResourceModel;
