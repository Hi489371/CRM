const crypto = require('crypto');
const { Lead } = require('../models');
const { sendEmail, isEmailConfigured } = require('../services/emailService');
const { applyStatusChange, parseDecisionMaker } = require('../utils/leadStatusHelper');

function getPublicAppUrl() {
  return (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}

function buildPortalLink(token) {
  return `${getPublicAppUrl()}/client/${token}`;
}

function appendPortalLink(body, token) {
  const link = buildPortalLink(token);
  const footer = `\n\n---\nView your personalized proposal and respond here:\n${link}`;
  if (body.includes(link)) return body;
  return `${body}${footer}`;
}

exports.createFromClientFinder = async (req, res, next) => {
  try {
    const {
      clientProfile = {},
      recipientEmail,
      subject,
      body,
      skills = [],
      trustScore,
    } = req.body;

    if (typeof trustScore === 'number' && trustScore < 50) {
      return res.status(403).json({
        message: 'This client has been flagged as suspicious. Email sending is disabled.',
      });
    }

    if (!recipientEmail || !subject || !body) {
      return res.status(400).json({
        message: 'recipientEmail, subject, and body are required',
      });
    }

    if (!isEmailConfigured()) {
      return res.status(500).json({
        message: 'Email is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in backend/.env.',
      });
    }

    const { firstName, lastName, title } = parseDecisionMaker(clientProfile.decisionMaker);
    const companyName = clientProfile.companyName || clientProfile.company || '';
    const token = crypto.randomBytes(16).toString('hex');
    const portalLink = buildPortalLink(token);
    const emailBody = appendPortalLink(body, token);
    const proposalSent = `Subject: ${subject}\n\n${emailBody}`;

    const lead = new Lead({
      firstName,
      lastName,
      email: recipientEmail.toLowerCase().trim(),
      company: companyName,
      industry: clientProfile.industry || '',
      location: clientProfile.location || 'India',
      likelyNeed: clientProfile.likelyNeed || '',
      estimatedBudget: clientProfile.estimatedBudget || '',
      decisionMakerTitle: title,
      skills,
      source: 'client-finder',
      assignedTo: req.user.id,
      token,
      proposalSent,
      emailSubject: subject,
      notes: clientProfile.likelyNeed || '',
      statusHistory: [{ status: 'new', changedAt: new Date(), note: 'Lead created from Client Finder' }],
    });

    applyStatusChange(lead, 'email_sent', 'Outreach email sent via Client Finder');

    await sendEmail({
      to: recipientEmail,
      subject,
      text: emailBody,
    });

    lead.lastContacted = new Date();
    await lead.save();
    await lead.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Email sent and lead created',
      lead,
      portalLink,
    });
  } catch (error) {
    next(error);
  }
};

exports.resendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, body, recipientEmail } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (!isEmailConfigured()) {
      return res.status(500).json({ message: 'Email is not configured' });
    }

    const emailSubject = subject || lead.emailSubject || 'Follow up';
    let emailBody = body || lead.proposalSent?.replace(/^Subject:.*?\n\n/s, '') || '';
    if (lead.token) {
      emailBody = appendPortalLink(emailBody, lead.token);
    }

    await sendEmail({
      to: recipientEmail || lead.email,
      subject: emailSubject,
      text: emailBody,
    });

    lead.emailSubject = emailSubject;
    lead.proposalSent = `Subject: ${emailSubject}\n\n${emailBody}`;
    lead.lastContacted = new Date();
    applyStatusChange(lead, lead.status === 'new' ? 'email_sent' : 'follow_up', 'Email re-sent from CRM');
    await lead.save();

    res.json({ success: true, message: 'Email sent', lead });
  } catch (error) {
    next(error);
  }
};

exports.sendFollowUpEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;
    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const emailSubject = subject || `Follow up: ${lead.company || 'your project'}`;
    const emailBody =
      body ||
      `Hi ${lead.firstName},\n\nI wanted to follow up on my previous message regarding ${lead.likelyNeed || 'your project'}.\n\nWould you have time for a quick call this week?\n\nBest regards`;

    req.body = { subject: emailSubject, body: emailBody };
    return exports.resendEmail(req, res, next);
  } catch (error) {
    next(error);
  }
};

exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    applyStatusChange(lead, status, note || 'Manual status update');
    await lead.save();

    res.json({ success: true, lead });
  } catch (error) {
    if (error.message?.includes('Invalid lead status')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
