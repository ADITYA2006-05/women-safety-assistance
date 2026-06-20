const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticateToken } = require('../utils/authMiddleware');

router.post('/', authenticateToken, alertController.triggerAlert);
router.get('/active', authenticateToken, alertController.getActiveAlerts);
router.get('/history', authenticateToken, alertController.getAlertHistory);
router.get('/:alertId', authenticateToken, alertController.getAlertDetails);
router.post('/:alertId/accept', authenticateToken, alertController.acceptAlert);
router.post('/:alertId/status', authenticateToken, alertController.updateAlertStatus);
router.post('/:alertId/report', authenticateToken, alertController.submitReport);

module.exports = router;
