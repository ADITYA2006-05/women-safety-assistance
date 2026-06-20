const mongoose = require('mongoose');

const IncidentReportSchema = new mongoose.Schema({
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  volunteerName: { type: String },
  notes: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

let IncidentReportModel;
try {
  IncidentReportModel = mongoose.model('IncidentReport');
} catch (e) {
  IncidentReportModel = mongoose.model('IncidentReport', IncidentReportSchema);
}

module.exports = IncidentReportModel;
