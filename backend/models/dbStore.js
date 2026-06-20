const bcrypt = require('bcryptjs');

// Centralized In-Memory DB Store with seed data
const dbStore = {
  users: [],
  emergencyContacts: [],
  volunteers: [],
  alerts: [],
  incidentReports: [],
  safetyResources: []
};

// Seed initial safety resources (Safe Zones, Police Stations, Hospitals)
dbStore.safetyResources = [
  {
    _id: 'sr1',
    name: 'Central Police Station',
    type: 'PoliceStation',
    location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore Centroid
    address: 'Hudson Circle, Bangalore, Karnataka',
    phone: '+91 80 2221 1111',
    createdAt: new Date()
  },
  {
    _id: 'sr2',
    name: 'St. Martha\'s Hospital',
    type: 'Hospital',
    location: { type: 'Point', coordinates: [77.5960, 12.9730] },
    address: 'Nrupathunga Road, Bangalore, Karnataka',
    phone: '+91 80 2227 5081',
    createdAt: new Date()
  },
  {
    _id: 'sr3',
    name: 'Women\'s Helpline Safe Zone Alpha',
    type: 'SafeZone',
    location: { type: 'Point', coordinates: [77.5910, 12.9690] },
    address: 'Cubbon Park Main Gate, Bangalore, Karnataka',
    phone: '1091',
    createdAt: new Date()
  },
  {
    _id: 'sr4',
    name: 'Koramangala Safe Zone Beta',
    type: 'SafeZone',
    location: { type: 'Point', coordinates: [77.6245, 12.9348] },
    address: '80 Feet Road, Koramangala, Bangalore',
    phone: '1091',
    createdAt: new Date()
  },
  {
    _id: 'sr5',
    name: 'Indiranagar Police Station',
    type: 'PoliceStation',
    location: { type: 'Point', coordinates: [77.6387, 12.9719] },
    address: '100 Feet Road, Indiranagar, Bangalore',
    phone: '+91 80 2294 2522',
    createdAt: new Date()
  }
];

// Helper to seed initial admin and mock users/volunteers
const seedInMemoryData = async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Admin
  dbStore.users.push({
    _id: 'admin_id',
    name: 'System Admin',
    email: 'admin@safeguard.com',
    passwordHash: passwordHash,
    role: 'Admin',
    phone: '+91 9999999999',
    createdAt: new Date()
  });

  // 2. Regular User (Woman)
  dbStore.users.push({
    _id: 'user_id',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    passwordHash: passwordHash,
    role: 'User',
    phone: '+91 9876543210',
    createdAt: new Date()
  });

  // Seed Priya's emergency contacts
  dbStore.emergencyContacts.push(
    {
      _id: 'ec1',
      userId: 'user_id',
      name: 'Rajesh Sharma (Father)',
      phone: '+91 9876543211',
      relationship: 'Father',
      isNotifiedBySOS: true,
      createdAt: new Date()
    },
    {
      _id: 'ec2',
      userId: 'user_id',
      name: 'Anjali Sharma (Mother)',
      phone: '+91 9876543212',
      relationship: 'Mother',
      isNotifiedBySOS: true,
      createdAt: new Date()
    }
  );

  // 3. Verified Volunteers
  const volunteerUsers = [
    {
      _id: 'vol_u1',
      name: 'Amit Patel',
      email: 'amit@volunteer.com',
      passwordHash: passwordHash,
      role: 'Volunteer',
      phone: '+91 9123456780',
      createdAt: new Date()
    },
    {
      _id: 'vol_u2',
      name: 'Kiran Rao',
      email: 'kiran@volunteer.com',
      passwordHash: passwordHash,
      role: 'Volunteer',
      phone: '+91 9123456781',
      createdAt: new Date()
    },
    {
      _id: 'vol_u3',
      name: 'Sneha Reddy',
      email: 'sneha@volunteer.com',
      passwordHash: passwordHash,
      role: 'Volunteer',
      phone: '+91 9123456782',
      createdAt: new Date()
    }
  ];

  dbStore.users.push(...volunteerUsers);

  // Map user ID to Volunteer entities
  dbStore.volunteers.push(
    {
      _id: 'vol_e1',
      userId: 'vol_u1',
      name: 'Amit Patel',
      phone: '+91 9123456780',
      verificationStatus: 'Approved',
      isOnline: true,
      currentLocation: { type: 'Point', coordinates: [77.5950, 12.9725] }, // Extremely close to cubbon park
      updatedAt: new Date()
    },
    {
      _id: 'vol_e2',
      userId: 'vol_u2',
      name: 'Kiran Rao',
      phone: '+91 9123456781',
      verificationStatus: 'Approved',
      isOnline: true,
      currentLocation: { type: 'Point', coordinates: [77.5900, 12.9700] }, // Close to Cubbon park
      updatedAt: new Date()
    },
    {
      _id: 'vol_e3',
      userId: 'vol_u3',
      name: 'Sneha Reddy',
      phone: '+91 9123456782',
      verificationStatus: 'Pending',
      isOnline: false,
      currentLocation: { type: 'Point', coordinates: [77.6230, 12.9340] }, // Near Koramangala
      updatedAt: new Date()
    }
  );

  // 4. Mock Alert History
  dbStore.alerts.push(
    {
      _id: 'alert_h1',
      userId: 'user_id',
      userName: 'Priya Sharma',
      userPhone: '+91 9876543210',
      status: 'Resolved',
      location: { type: 'Point', coordinates: [77.5940, 12.9710] },
      responderId: 'vol_u1',
      responderName: 'Amit Patel',
      responderPhone: '+91 9123456780',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      resolvedAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000)
    },
    {
      _id: 'alert_h2',
      userId: 'user_id',
      userName: 'Priya Sharma',
      userPhone: '+91 9876543210',
      status: 'Cancelled',
      location: { type: 'Point', coordinates: [77.6250, 12.9350] },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      resolvedAt: new Date(Date.now() - 23.9 * 60 * 60 * 1000)
    }
  );

  // Mock Incident Reports
  dbStore.incidentReports.push({
    _id: 'ir1',
    alertId: 'alert_h1',
    userId: 'user_id',
    userName: 'Priya Sharma',
    volunteerId: 'vol_u1',
    volunteerName: 'Amit Patel',
    notes: 'Volunteer arrived within 3 minutes and walked the user safely to the nearest zone.',
    severity: 'Medium',
    createdAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000)
  });
};

seedInMemoryData();

module.exports = {
  dbStore
};
