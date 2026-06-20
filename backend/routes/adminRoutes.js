const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../utils/authMiddleware');

// Secure all admin routes to Admin role only
router.get('/volunteers', authenticateToken, authorizeRoles('Admin'), adminController.getVolunteers);
router.post('/volunteers/:volunteerId/verify', authenticateToken, authorizeRoles('Admin'), adminController.verifyVolunteer);
router.get('/users', authenticateToken, authorizeRoles('Admin'), adminController.getUsers);
router.get('/stats', authenticateToken, authorizeRoles('Admin'), adminController.getDashboardStats);

module.exports = router;
