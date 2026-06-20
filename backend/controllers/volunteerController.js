const Volunteer = require('../models/Volunteer');
const { dbStore } = require('../models/dbStore');

// Toggle Online Status
exports.toggleOnline = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isOnline } = req.body;

    if (isOnline === undefined) {
      return res.status(400).json({ error: 'isOnline status is required' });
    }

    let volunteer;
    if (global.useInMemoryDb) {
      volunteer = dbStore.volunteers.find(v => v.userId === userId);
      if (!volunteer) {
        return res.status(404).json({ error: 'Volunteer record not found' });
      }
      volunteer.isOnline = isOnline;
      volunteer.updatedAt = new Date();
    } else {
      volunteer = await Volunteer.findOne({ userId });
      if (!volunteer) {
        return res.status(404).json({ error: 'Volunteer record not found' });
      }
      volunteer.isOnline = isOnline;
      volunteer.updatedAt = new Date();
      await volunteer.save();
    }

    res.json({ success: true, volunteer });
  } catch (error) {
    console.error('Toggle online error:', error);
    res.status(500).json({ error: 'Server error toggling online status' });
  }
};

// Update Location
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { longitude, latitude } = req.body;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    let volunteer;
    if (global.useInMemoryDb) {
      volunteer = dbStore.volunteers.find(v => v.userId === userId);
      if (!volunteer) {
        return res.status(404).json({ error: 'Volunteer record not found' });
      }
      volunteer.currentLocation = { type: 'Point', coordinates: [longitude, latitude] };
      volunteer.updatedAt = new Date();
    } else {
      volunteer = await Volunteer.findOne({ userId });
      if (!volunteer) {
        return res.status(404).json({ error: 'Volunteer record not found' });
      }
      volunteer.currentLocation = { type: 'Point', coordinates: [longitude, latitude] };
      volunteer.updatedAt = new Date();
      await volunteer.save();
    }

    // Broadcast location update to anyone watching live alerts
    if (global.io) {
      global.io.emit('volunteer-location-updated', {
        volunteerId: userId,
        name: volunteer.name,
        phone: volunteer.phone,
        location: [longitude, latitude]
      });
    }

    res.json({ success: true, location: [longitude, latitude] });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Server error updating location' });
  }
};

// Get Volunteer Status
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    let volunteer;

    if (global.useInMemoryDb) {
      volunteer = dbStore.volunteers.find(v => v.userId === userId);
    } else {
      volunteer = await Volunteer.findOne({ userId });
    }

    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer profile not found' });
    }

    res.json(volunteer);
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Server error fetching status' });
  }
};
