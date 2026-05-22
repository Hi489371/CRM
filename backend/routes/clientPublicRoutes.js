const express = require('express');
const rateLimit = require('express-rate-limit');
const clientPublicController = require('../controllers/clientPublicController');

const router = express.Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(publicLimiter);

router.get('/:token', clientPublicController.getClientPortal);
router.post('/:token/respond', clientPublicController.respondToPortal);
router.post('/:token/schedule', clientPublicController.scheduleCall);
router.post('/:token/chat', clientPublicController.publicChat);

module.exports = router;
