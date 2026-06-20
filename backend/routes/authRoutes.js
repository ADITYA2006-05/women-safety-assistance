const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../utils/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', authenticateToken, authController.getProfile);
router.post('/contacts', authenticateToken, authController.addEmergencyContact);
router.delete('/contacts/:contactId', authenticateToken, authController.deleteEmergencyContact);

module.exports = router;
