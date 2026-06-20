const Alert = require('../models/Alert');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const IncidentReport = require('../models/IncidentReport');
const EmergencyContact = require('../models/EmergencyContact');
const { dbStore } = require('../models/dbStore');
const { getDistanceKm } = require('../utils/proximity');

const generateId = () => Math.random().toString(36).substring(2, 15);

// Trigger new SOS alert
exports.triggerAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { longitude, latitude } = req.body;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'Coordinates are required for SOS alert' });
    }

    let user;
    let contacts = [];
    if (global.useInMemoryDb) {
      user = dbStore.users.find(u => u._id === userId);
      contacts = dbStore.emergencyContacts.filter(c => c.userId === userId);
    } else {
      user = await User.findById(userId);
      contacts = await EmergencyContact.find({ userId });
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Create the alert
    let alert;
    if (global.useInMemoryDb) {
      alert = {
        _id: 'alert_' + generateId(),
        userId: user._id,
        userName: user.name,
        userPhone: user.phone,
        status: 'Active',
        location: { type: 'Point', coordinates: [longitude, latitude] },
        createdAt: new Date()
      };
      dbStore.alerts.push(alert);
    } else {
      alert = new Alert({
        userId: user._id,
        userName: user.name,
        userPhone: user.phone,
        status: 'Active',
        location: { type: 'Point', coordinates: [longitude, latitude] }
      });
      await alert.save();
    }

    // 2. Mock sending SMS to emergency contacts
    console.log(`\n🚨 [SMS BROADCAST] Sending emergency alerts to contacts of ${user.name}:`);
    contacts.forEach(contact => {
      console.log(`📱 To: ${contact.name} (${contact.phone}) - "SOS Alert! Priya Sharma is in distress at coordinates [${latitude}, ${longitude}]. Tracking Link: http://localhost:3000/live-track/${alert._id}"`);
    });
    console.log('🚨 [SMS BROADCAST COMPLETE]\n');

    // 3. Find nearby active volunteers (within 5km)
    let nearbyVolunteers = [];

    if (global.useInMemoryDb) {
      nearbyVolunteers = dbStore.volunteers.filter(vol => {
        if (!vol.isOnline || vol.verificationStatus !== 'Approved') return false;
        const [volLong, volLat] = vol.currentLocation.coordinates;
        const dist = getDistanceKm(latitude, longitude, volLat, volLong);
        return dist <= 5.0; // 5 km radius
      });
    } else {
      // Geospatial query
      nearbyVolunteers = await Volunteer.find({
        verificationStatus: 'Approved',
        isOnline: true,
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: 5000 // 5km in meters
          }
        }
      });
    }

    // 4. Emit to volunteers through socket.io
    if (global.io) {
      // Emit alert broadcast
      global.io.emit('new-sos-alert', {
        alert,
        nearbyCount: nearbyVolunteers.length
      });
      console.log(`🔊 [Websocket] Emitted 'new-sos-alert' to volunteers. Proximity count: ${nearbyVolunteers.length}`);
    }

    res.status(201).json({
      success: true,
      alert,
      nearbyVolunteersCount: nearbyVolunteers.length
    });
  } catch (error) {
    console.error('Trigger alert error:', error);
    res.status(500).json({ error: 'Server error triggering SOS alert' });
  }
};

// Accept an active alert
exports.acceptAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const volunteerUserId = req.user.id;

    let volunteer;
    let userRecord;

    if (global.useInMemoryDb) {
      volunteer = dbStore.volunteers.find(v => v.userId === volunteerUserId);
      userRecord = dbStore.users.find(u => u._id === volunteerUserId);
    } else {
      volunteer = await Volunteer.findOne({ userId: volunteerUserId });
      userRecord = await User.findById(volunteerUserId);
    }

    if (!volunteer || volunteer.verificationStatus !== 'Approved') {
      return res.status(403).json({ error: 'Only verified volunteers can accept emergency alerts' });
    }

    let alert;
    if (global.useInMemoryDb) {
      alert = dbStore.alerts.find(a => a._id === alertId);
      if (!alert) return res.status(404).json({ error: 'Alert not found' });
      if (alert.status !== 'Active') {
        return res.status(400).json({ error: `Alert is already ${alert.status}` });
      }

      alert.status = 'Accepted';
      alert.responderId = volunteerUserId;
      alert.responderName = userRecord.name;
      alert.responderPhone = userRecord.phone;
    } else {
      alert = await Alert.findById(alertId);
      if (!alert) return res.status(404).json({ error: 'Alert not found' });
      if (alert.status !== 'Active') {
        return res.status(400).json({ error: `Alert is already ${alert.status}` });
      }

      alert.status = 'Accepted';
      alert.responderId = volunteerUserId;
      alert.responderName = userRecord.name;
      alert.responderPhone = userRecord.phone;
      await alert.save();
    }

    // Broadcast update via WebSocket
    if (global.io) {
      global.io.emit('alert-updated', alert);
      console.log(`🔊 [Websocket] Emitted 'alert-updated' for alert ${alertId} - status: Accepted`);
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Accept alert error:', error);
    res.status(500).json({ error: 'Server error accepting alert' });
  }
};

// Resolve or cancel alert
exports.updateAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body; // 'Resolved', 'Cancelled'

    if (!['Resolved', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update' });
    }

    let alert;
    if (global.useInMemoryDb) {
      alert = dbStore.alerts.find(a => a._id === alertId);
      if (!alert) return res.status(404).json({ error: 'Alert not found' });

      alert.status = status;
      alert.resolvedAt = new Date();
    } else {
      alert = await Alert.findById(alertId);
      if (!alert) return res.status(404).json({ error: 'Alert not found' });

      alert.status = status;
      alert.resolvedAt = new Date();
      await alert.save();
    }

    if (global.io) {
      global.io.emit('alert-updated', alert);
      console.log(`🔊 [Websocket] Emitted 'alert-updated' for alert ${alertId} - status: ${status}`);
    }

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error updating alert status' });
  }
};

// Get details of a specific alert
exports.getAlertDetails = async (req, res) => {
  try {
    const { alertId } = req.params;
    let alert;

    if (global.useInMemoryDb) {
      alert = dbStore.alerts.find(a => a._id === alertId);
    } else {
      alert = await Alert.findById(alertId);
    }

    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (error) {
    console.error('Get alert details error:', error);
    res.status(500).json({ error: 'Server error fetching alert' });
  }
};

// List all active alerts
exports.getActiveAlerts = async (req, res) => {
  try {
    let activeAlerts = [];
    if (global.useInMemoryDb) {
      activeAlerts = dbStore.alerts.filter(a => a.status === 'Active' || a.status === 'Accepted');
    } else {
      activeAlerts = await Alert.find({ status: { $in: ['Active', 'Accepted'] } }).sort({ createdAt: -1 });
    }
    res.json(activeAlerts);
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({ error: 'Server error fetching active alerts' });
  }
};

// Get alert history for a user
exports.getAlertHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    let history = [];

    if (global.useInMemoryDb) {
      history = dbStore.alerts.filter(a => a.userId === userId || a.responderId === userId);
    } else {
      history = await Alert.find({
        $or: [{ userId }, { responderId: userId }]
      }).sort({ createdAt: -1 });
    }

    res.json(history);
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({ error: 'Server error fetching history' });
  }
};

// Submit an incident report
exports.submitReport = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes, severity } = req.body;
    const authorId = req.user.id;

    if (!notes) return res.status(400).json({ error: 'Notes are required' });

    let alert;
    let reporter;

    if (global.useInMemoryDb) {
      alert = dbStore.alerts.find(a => a._id === alertId);
      reporter = dbStore.users.find(u => u._id === authorId);
    } else {
      alert = await Alert.findById(alertId);
      reporter = await User.findById(authorId);
    }

    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    let report;
    if (global.useInMemoryDb) {
      report = {
        _id: 'report_' + generateId(),
        alertId,
        userId: alert.userId,
        userName: alert.userName,
        volunteerId: alert.responderId,
        volunteerName: alert.responderName,
        notes,
        severity: severity || 'Medium',
        createdAt: new Date()
      };
      dbStore.incidentReports.push(report);
    } else {
      report = new IncidentReport({
        alertId,
        userId: alert.userId,
        userName: alert.userName,
        volunteerId: alert.responderId,
        volunteerName: alert.responderName,
        notes,
        severity: severity || 'Medium'
      });
      await report.save();
    }

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Server error submitting incident report' });
  }
};
