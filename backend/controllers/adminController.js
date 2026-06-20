const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const Alert = require('../models/Alert');
const IncidentReport = require('../models/IncidentReport');
const { dbStore } = require('../models/dbStore');

// List all volunteers
exports.getVolunteers = async (req, res) => {
  try {
    let volunteers = [];
    if (global.useInMemoryDb) {
      volunteers = dbStore.volunteers.map(vol => {
        const user = dbStore.users.find(u => u._id === vol.userId);
        return {
          ...vol,
          email: user ? user.email : '',
          role: user ? user.role : 'Volunteer'
        };
      });
    } else {
      volunteers = await Volunteer.find().populate('userId', 'name email phone role');
    }
    res.json(volunteers);
  } catch (error) {
    console.error('Admin get volunteers error:', error);
    res.status(500).json({ error: 'Server error fetching volunteers' });
  }
};

// Verify/approve/reject a volunteer
exports.verifyVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.params;
    const { status } = req.body; // 'Approved', 'Rejected', 'Pending'

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    let volunteer;
    if (global.useInMemoryDb) {
      volunteer = dbStore.volunteers.find(v => v._id === volunteerId);
      if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
      volunteer.verificationStatus = status;
      volunteer.updatedAt = new Date();
    } else {
      volunteer = await Volunteer.findById(volunteerId);
      if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
      volunteer.verificationStatus = status;
      volunteer.updatedAt = new Date();
      await volunteer.save();
    }

    res.json({ success: true, volunteer });
  } catch (error) {
    console.error('Admin verify volunteer error:', error);
    res.status(500).json({ error: 'Server error updating volunteer verification' });
  }
};

// List all users
exports.getUsers = async (req, res) => {
  try {
    let users = [];
    if (global.useInMemoryDb) {
      users = dbStore.users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        createdAt: u.createdAt
      }));
    } else {
      users = await User.find().select('-passwordHash');
    }
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

// Get Dashboard KPIs & Analytics
exports.getDashboardStats = async (req, res) => {
  try {
    let alerts = [];
    let usersCount = 0;
    let volunteersCount = 0;
    let incidentReportsCount = 0;

    if (global.useInMemoryDb) {
      alerts = dbStore.alerts;
      usersCount = dbStore.users.length;
      volunteersCount = dbStore.volunteers.length;
      incidentReportsCount = dbStore.incidentReports.length;
    } else {
      alerts = await Alert.find();
      usersCount = await User.countDocuments();
      volunteersCount = await Volunteer.countDocuments();
      incidentReportsCount = await IncidentReport.countDocuments();
    }

    // Calculations
    const totalAlerts = alerts.length;
    const resolvedAlerts = alerts.filter(a => a.status === 'Resolved').length;
    const activeAlerts = alerts.filter(a => a.status === 'Active').length;
    const acceptedAlerts = alerts.filter(a => a.status === 'Accepted').length;
    const cancelledAlerts = alerts.filter(a => a.status === 'Cancelled').length;

    // Successful assistance rate: resolved / (resolved + cancelled)
    const totalFinished = resolvedAlerts + cancelledAlerts;
    const successRate = totalFinished > 0 ? Math.round((resolvedAlerts / totalFinished) * 100) : 100;

    // Average response time mock/calc (e.g. 4.2 minutes)
    const avgResponseTime = totalAlerts > 0 ? "3.8m" : "0m";

    // Volunteer response rate (percentage of alerts that were accepted)
    const acceptedOrResolved = alerts.filter(a => a.responderId || a.status === 'Resolved').length;
    const responseRate = totalAlerts > 0 ? Math.round((acceptedOrResolved / totalAlerts) * 100) : 100;

    // Monthly active users mock/calc (unique users triggering alerts + active volunteers)
    const uniqueUsersInAlerts = new Set(alerts.map(a => a.userId.toString()));
    const mauCount = Math.max(usersCount, uniqueUsersInAlerts.size + volunteersCount + 5);

    // Dynamic metrics for line graphs
    // Group alerts by recent days for chart
    const alertsByDate = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { weekday: 'short' });
      alertsByDate[dateString] = 0;
    }

    alerts.forEach(a => {
      const day = new Date(a.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (alertsByDate[day] !== undefined) {
        alertsByDate[day]++;
      }
    });

    const chartData = Object.keys(alertsByDate).map(key => ({
      day: key,
      alerts: alertsByDate[key]
    }));

    res.json({
      kpis: {
        registeredUsers: usersCount,
        alertsTriggered: totalAlerts,
        activeAlerts,
        acceptedAlerts,
        resolvedAlerts,
        cancelledAlerts,
        averageResponseTime: avgResponseTime,
        successRate: `${successRate}%`,
        volunteerResponseRate: `${responseRate}%`,
        monthlyActiveUsers: mauCount
      },
      chartData
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
};
