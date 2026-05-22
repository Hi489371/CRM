const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Dashboard routes
router.get('/', dashboardController.getDashboardStats);
router.get('/user', dashboardController.getUserDashboard);
router.get('/reports', dashboardController.getReports);

module.exports = router;
