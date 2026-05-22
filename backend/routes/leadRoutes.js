const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const leadOutreachController = require('../controllers/leadOutreachController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get statistics
router.get('/stats', leadController.getLeadStats);

// Client Finder outreach flow
router.post('/from-client-finder', leadOutreachController.createFromClientFinder);
router.post('/:id/resend-email', leadOutreachController.resendEmail);
router.post('/:id/follow-up-email', leadOutreachController.sendFollowUpEmail);
router.patch('/:id/status', leadOutreachController.updateLeadStatus);

// CRUD operations
router.post('/', leadController.createLead);
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLead);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

// Convert lead
router.post('/:id/convert', leadController.convertLead);

module.exports = router;
