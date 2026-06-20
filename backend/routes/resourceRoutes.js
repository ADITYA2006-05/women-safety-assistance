const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { authenticateToken, authorizeRoles } = require('../utils/authMiddleware');

router.get('/', authenticateToken, resourceController.getAllResources);
router.get('/nearby', authenticateToken, resourceController.getNearbyResources);
router.post('/', authenticateToken, authorizeRoles('Admin'), resourceController.createResource);

module.exports = router;
