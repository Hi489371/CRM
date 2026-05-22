const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.use(authMiddleware);

router.get('/me', authController.getCurrentUser);
router.put('/me', authController.updateProfile);
router.put('/change-password', authController.changePassword);

// Admin routes
router.get('/users', authorize('admin'), authController.getAllUsers);
router.put('/users/:id', authorize('admin'), authController.updateUser);
router.delete('/users/:id', authorize('admin'), authController.deleteUser);

module.exports = router;
