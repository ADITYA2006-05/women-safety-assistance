const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verificationStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  isOnline: { type: Boolean, default: false },
  phone: { type: String }, // cached for speed
  name: { type: String }, // cached for speed
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  updatedAt: { type: Date, default: Date.now }
});

VolunteerSchema.index({ currentLocation: '2dsphere' });

let VolunteerModel;
try {
  VolunteerModel = mongoose.model('Volunteer');
} catch (e) {
  VolunteerModel = mongoose.model('Volunteer', VolunteerSchema);
}

module.exports = VolunteerModel;
