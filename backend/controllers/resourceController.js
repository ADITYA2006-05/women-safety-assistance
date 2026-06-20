const SafetyResource = require('../models/SafetyResource');
const { dbStore } = require('../models/dbStore');
const { getDistanceKm } = require('../utils/proximity');
const { sequelize } = require('../config/db');

// Get All Safety Resources
exports.getAllResources = async (req, res) => {
  try {
    let resources = [];
    if (global.useInMemoryDb) {
      resources = dbStore.safetyResources;
    } else {
      resources = await SafetyResource.findAll();
    }
    res.json(resources);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Server error fetching resources' });
  }
};

// Create a Safety Resource (Admin only)
exports.createResource = async (req, res) => {
  try {
    const { name, type, longitude, latitude, address, phone } = req.body;

    if (!name || !type || longitude === undefined || latitude === undefined || !address || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let resource;
    if (global.useInMemoryDb) {
      resource = {
        _id: 'sr_' + Math.random().toString(36).substring(2, 15),
        name,
        type,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        address,
        phone,
        createdAt: new Date()
      };
      dbStore.safetyResources.push(resource);
    } else {
      resource = await SafetyResource.create({
        name,
        type,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        address,
        phone
      });
    }

    res.status(201).json({ success: true, resource });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Server error creating resource' });
  }
};

// Get Nearby Resources
exports.getNearbyResources = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5 } = req.query; // maxDistance in km, default 5

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const distLimit = parseFloat(maxDistance);

    let nearby = [];

    if (global.useInMemoryDb) {
      nearby = dbStore.safetyResources.filter(res => {
        const [resLong, resLat] = res.location.coordinates;
        const distance = getDistanceKm(lat, lon, resLat, resLong);
        return distance <= distLimit;
      });
    } else {
      nearby = await SafetyResource.findAll({
        where: sequelize.literal(`ST_DWithin("location", ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${distLimit * 1000})`),
        order: sequelize.literal(`ST_Distance("location", ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography) ASC`)
      });
    }

    res.json(nearby);
  } catch (error) {
    console.error('Get nearby resources error:', error);
    res.status(500).json({ error: 'Server error fetching nearby resources' });
  }
};
