const axios = require('axios');

// Model and defaults
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const MAX_TOKENS = process.env.CLAUDE_MAX_TOKENS ? parseInt(process.env.CLAUDE_MAX_TOKENS, 10) : 1000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  console.warn('Warning: CLAUDE_API_KEY is not set. AI requests will fail until configured.');
}

// Basic wrapper that posts to Anthropic Claude completion endpoint.
async function callClaude(prompt) {
  const url = 'https://api.anthropic.com/v1/complete';
  const body = {
    model: CLAUDE_MODEL,
    prompt,
    max_tokens: MAX_TOKENS,
    // Temperature and other params may be added if required
  };

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': CLAUDE_API_KEY,
  };

  const response = await axios.post(url, body, { headers, timeout: 60000 });
  // Anthropic responses typically include 'completion' with the generated text
  return response.data?.completion || response.data;
}

// Build a structured prompt for the client finder
function buildFinderPrompt({ industry, companySize, region, offering }) {
  return `You are an expert freelance business developer. Generate 5 realistic potential client leads that fit the following criteria.
Respond in JSON array with objects having keys: company, contactPerson, role, email, painPoint, projectType, fitScore (0-100), estimatedBudget.

Criteria:
- industry: ${industry || 'any'}
- companySize: ${companySize || 'small/medium/large'}
- region: ${region || 'global'}
- offering: ${offering || 'software development services'}

Keep responses realistic and brief.`;
}

// Build prompt for proposal writer
function buildProposalPrompt({ clientName, company, scope, budget, timeline, features, yourName, brand }) {
  return `You are a professional proposal writer for freelancers. Write a full professional proposal for the client below. Include sections: Introduction, Project Understanding, Proposed Solution & Tech Stack, Deliverables, Timeline, Investment/Pricing, Why Choose Us, Next Steps.

Client: ${clientName || ''}
Company: ${company || ''}
Scope: ${scope || ''}
Budget: ${budget || ''}
Timeline: ${timeline || ''}
Key features: ${features || ''}
Your name/brand: ${yourName || brand || ''}

Produce a clear, persuasive, and formal proposal.`;
}

// Build prompt for email drafter
function buildEmailPrompt({ type, recipientName, company, context, tone }) {
  return `Write a ${type} email under 120 words with a subject line. Recipient: ${recipientName || ''}, Company: ${company || ''}. Context: ${context || ''}. Tone: ${tone || 'professional and concise'}.`;
}

// Build prompt for chat (system + history can be appended by controller)
function buildChatPrompt(systemPrompt, conversation) {
  // conversation should be an array of { role: 'user'|'assistant', content }
  let prompt = `${systemPrompt}\n\n`;
  conversation.forEach((m) => {
    prompt += `${m.role === 'user' ? 'Human:' : 'Assistant:'} ${m.content}\n`;
  });
  prompt += 'Assistant:';
  return prompt;
}

// Public API
module.exports = {
  runFinder: async (payload) => {
    const prompt = buildFinderPrompt(payload);
    return callClaude(prompt);
  },

  runProposal: async (payload) => {
    const prompt = buildProposalPrompt(payload);
    return callClaude(prompt);
  },

  runEmailDraft: async (payload) => {
    const prompt = buildEmailPrompt(payload);
    return callClaude(prompt);
  },

  runChat: async (systemPrompt, conversation) => {
    const prompt = buildChatPrompt(systemPrompt, conversation);
    return callClaude(prompt);
  },
};
