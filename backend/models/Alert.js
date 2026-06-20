const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Accepted', 'Resolved', 'Cancelled'], default: 'Active' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responderName: { type: String },
  responderPhone: { type: String },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date }
});

AlertSchema.index({ location: '2dsphere' });

let AlertModel;
try {
  AlertModel = mongoose.model('Alert');
} catch (e) {
  AlertModel = mongoose.model('Alert', AlertSchema);
}

module.exports = AlertModel;
