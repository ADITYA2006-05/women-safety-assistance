const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { authenticateToken, authorizeRoles } = require('../utils/authMiddleware');

router.post('/toggle-online', authenticateToken, authorizeRoles('Volunteer'), volunteerController.toggleOnline);
router.post('/location', authenticateToken, authorizeRoles('Volunteer'), volunteerController.updateLocation);
router.get('/status', authenticateToken, authorizeRoles('Volunteer'), volunteerController.getStatus);

module.exports = router;
