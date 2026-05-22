const { Lead } = require('../models');
const { callOpenRouter } = require('../utils/openRouterClient');
const { applyStatusChange } = require('../utils/leadStatusHelper');

const COMPANY_NAME = process.env.COMPANY_NAME || 'Your Company';
const COMPANY_TAGLINE = process.env.COMPANY_TAGLINE || 'Building digital solutions for growing businesses';
const COMPANY_DESCRIPTION =
  process.env.COMPANY_DESCRIPTION ||
  'We help companies ship modern web apps, cloud infrastructure, and AI-powered products.';

async function findLeadByToken(token) {
  return Lead.findOne({ token }).select('-assignedTo');
}

exports.getClientPortal = async (req, res, next) => {
  try {
    const lead = await findLeadByToken(req.params.token);
    if (!lead) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }

    res.json({
      company: {
        name: COMPANY_NAME,
        tagline: COMPANY_TAGLINE,
        description: COMPANY_DESCRIPTION,
      },
      client: {
        companyName: lead.company,
        industry: lead.industry,
        location: lead.location,
        likelyNeed: lead.likelyNeed,
        estimatedBudget: lead.estimatedBudget,
        decisionMaker: `${lead.firstName} ${lead.lastName}`.trim(),
        decisionMakerTitle: lead.decisionMakerTitle,
      },
      proposal: lead.proposalSent,
      status: lead.status,
      hasResponded: Boolean(
        lead.clientResponse?.interestedAt ||
          lead.clientResponse?.notInterestedAt ||
          lead.clientResponse?.requirements?.submittedAt
      ),
    });
  } catch (error) {
    next(error);
  }
};

exports.respondToPortal = async (req, res, next) => {
  try {
    const { action, requirements } = req.body;
    const lead = await Lead.findOne({ token: req.params.token });
    if (!lead) return res.status(404).json({ message: 'Invalid link' });

    if (action === 'interested') {
      if (!lead.clientResponse) lead.clientResponse = {};
      lead.clientResponse.interestedAt = new Date();

      if (requirements) {
        lead.clientResponse.requirements = {
          name: requirements.name || '',
          company: requirements.company || lead.company,
          projectDescription: requirements.projectDescription || '',
          budgetRange: requirements.budgetRange || '',
          timeline: requirements.timeline || '',
          submittedAt: new Date(),
        };
        applyStatusChange(lead, 'negotiating', 'Client submitted project requirements');
      } else {
        applyStatusChange(lead, 'interested', 'Client marked as interested');
      }
    } else if (action === 'not_interested') {
      if (!lead.clientResponse) lead.clientResponse = {};
      lead.clientResponse.notInterestedAt = new Date();
      applyStatusChange(lead, 'lost', 'Client marked as not interested');
    } else {
      return res.status(400).json({ message: 'action must be interested or not_interested' });
    }

    await lead.save();
    res.json({ success: true, status: lead.status, message: 'Thank you for your response' });
  } catch (error) {
    next(error);
  }
};

exports.scheduleCall = async (req, res, next) => {
  try {
    const { name, phone, preferredTime } = req.body;
    const lead = await Lead.findOne({ token: req.params.token });
    if (!lead) return res.status(404).json({ message: 'Invalid link' });

    if (!lead.clientResponse) lead.clientResponse = {};
    lead.clientResponse.scheduledCall = {
      name: name || '',
      phone: phone || '',
      preferredTime: preferredTime || '',
      submittedAt: new Date(),
    };

    applyStatusChange(lead, 'meeting_scheduled', 'Client requested a call');
    await lead.save();

    res.json({ success: true, status: lead.status, message: 'Call request received. We will contact you soon.' });
  } catch (error) {
    next(error);
  }
};

exports.publicChat = async (req, res, next) => {
  try {
    const { message, conversation = [] } = req.body;
    const lead = await findLeadByToken(req.params.token);
    if (!lead) return res.status(404).json({ message: 'Invalid link' });

    const systemPrompt = `You are a helpful assistant for ${COMPANY_NAME}. The visitor is ${lead.firstName} from ${lead.company} (${lead.industry}). Their likely need: ${lead.likelyNeed}. Be professional, concise, and helpful about our services.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.slice(-10),
      { role: 'user', content: String(message || '').slice(0, 2000) },
    ];

    const reply = await callOpenRouter({
      model: process.env.OPENROUTER_MODEL_AI_CHATBOT || 'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const text = typeof reply === 'string' ? reply : reply?.content || String(reply);

    res.json({ success: true, reply: text });
  } catch (error) {
    next(error);
  }
};
