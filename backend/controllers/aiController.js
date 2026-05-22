const axios = require('axios');
const { validationResult } = require('express-validator');
const { callOpenRouter: callOpenRouterWithFailover } = require('../utils/openRouterClient');
const { Outreach } = require('../models');

// OpenRouter API configuration - calls go to OpenRouter with per-request model selection
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const OPENROUTER_API_KEY_FALLBACK = process.env.OPENROUTER_API_KEY_FALLBACK?.trim();
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_PLACEHOLDER = 'sk-or-v1-your-key-here';

const isValidOpenRouterKey = (key) => {
  return (
    key &&
    typeof key === 'string' &&
    key.length > 20 &&
    !key.toLowerCase().includes('your-key') &&
    !key.toLowerCase().includes('your-actual') &&
    key !== OPENROUTER_PLACEHOLDER
  );
};

const OPENROUTER_KEYS = [OPENROUTER_API_KEY, OPENROUTER_API_KEY_FALLBACK].filter(isValidOpenRouterKey);
const getOpenRouterKey = (attempt = 0) => OPENROUTER_KEYS[Math.min(attempt, OPENROUTER_KEYS.length - 1)];

const MODEL_FALLBACKS = {
  'meta-llama/llama-3.3-70b-instruct:free': [
    'mistralai/mistral-small-24b-instruct-2501:free',
    'google/gemma-4-31b-it:free',
  ],
  'mistralai/mistral-small-24b-instruct-2501:free': [
    'google/gemma-4-31b-it:free',
  ],
  'google/gemma-4-31b-it:free': [],
  'deepseek/deepseek-v4-flash:free': [],
  'qwen/qwen3-coder:free': [],
};

const getFallbackModel = (model, attempt = 0) => {
  const chain = MODEL_FALLBACKS[model] || [];
  return chain[attempt] || null;
};

// Model assignments - each feature uses the best model for its task
const MODELS = {
  CLIENT_FINDER: process.env.OPENROUTER_MODEL_CLIENT_FINDER || 'meta-llama/llama-3.3-70b-instruct:free', // Most capable for creative lead generation
  PROPOSAL_WRITER: process.env.OPENROUTER_MODEL_PROPOSAL_WRITER || 'mistralai/mistral-small-24b-instruct-2501:free', // Best for structured professional writing
  EMAIL_DRAFTER: process.env.OPENROUTER_MODEL_EMAIL_DRAFTER || 'google/gemma-4-31b-it:free', // Concise, instruction-tuned; perfect for short emails
  AI_CHATBOT: process.env.OPENROUTER_MODEL_AI_CHATBOT || 'meta-llama/llama-3.3-70b-instruct:free', // Best conversational ability
  LEAD_SCORER: process.env.OPENROUTER_MODEL_LEAD_SCORER || 'deepseek/deepseek-v4-flash:free', // Superior reasoning and JSON output
  SECURITY_CHECKER: process.env.OPENROUTER_MODEL_SECURITY_CHECKER || 'qwen/qwen3-coder:free', // Specialized in code analysis and security
  CLIENT_VERIFIER: process.env.OPENROUTER_MODEL_CLIENT_VERIFIER || process.env.OPENROUTER_MODEL_LEAD_SCORER || 'deepseek/deepseek-v4-flash:free',
};

function getTrustTier(trustScore) {
  const score = Number(trustScore);
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function normalizeVerificationResult(raw, fallbackIndex = 0) {
  const trustScore = Math.min(100, Math.max(0, Number(raw.trustScore) || 0));
  const checks = Array.isArray(raw.checks) ? raw.checks : [];
  return {
    trustScore,
    tier: getTrustTier(trustScore),
    tierLabel:
      trustScore >= 80
        ? 'High Trust'
        : trustScore >= 50
          ? 'Medium Trust'
          : 'Low Trust / Suspicious',
    summary: raw.summary || raw.scamRiskNote || '',
    checks: checks.map((c) => ({
      key: c.key || 'check',
      status: c.status === 'warn' ? 'warn' : c.status === 'fail' ? 'fail' : 'pass',
      label: c.label || String(c.key || 'Check'),
    })),
    scamRiskNote: raw.scamRiskNote || '',
    index: raw.index ?? fallbackIndex,
    canContact: trustScore >= 50,
  };
}

function buildDefaultVerification(client, index, reason) {
  return normalizeVerificationResult(
    {
      trustScore: 50,
      summary: reason,
      scamRiskNote: reason,
      checks: [
        { key: 'overall', status: 'warn', label: 'Verification unavailable — proceed with caution' },
      ],
    },
    index
  );
}

// Retry configuration for rate limiting (429 errors)
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

/**
 * Helper function to make OpenRouter API calls with retry logic for rate limits
 * @param {string} model - Model ID from MODELS object
 * @param {string} prompt - User prompt or messages array
 * @param {number} maxTokens - Maximum tokens for response (default 1000)
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise} Response from OpenRouter API
 */
async function callOpenRouter(model, prompt, maxTokens = 1000, retryCount = 0) {
  try {
    // Build message format expected by OpenRouter
    const messages = Array.isArray(prompt)
      ? prompt // Already in message format
      : [{ role: 'user', content: prompt }]; // Convert string to message

    if (!isValidOpenRouterKey(OPENROUTER_API_KEY) && !isValidOpenRouterKey(OPENROUTER_API_KEY_FALLBACK)) {
      throw new Error('OpenRouter API key is missing or still uses the placeholder value. Update backend/.env with a real key and restart the server.');
    }

    const key = getOpenRouterKey(retryCount);
    if (!key) {
      throw new Error('OpenRouter API key is missing or invalid. Update backend/.env with a real key.');
    }

    const response = await axios.post(OPENROUTER_BASE_URL, {
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7, // Balance between consistency and creativity
    }, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'CRM AI Assistant',
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    const status = error.response?.status;
    const retryAfterHeader = error.response?.headers?.['retry-after'];
    const retryAfterMs = Math.max(parseInt(retryAfterHeader || '3', 10), 1) * 1000;
    const retryDelay = retryAfterMs || RETRY_DELAY * (retryCount + 1);

    const nextKeyAttempt = retryCount + 1;
    const nextKey = getOpenRouterKey(nextKeyAttempt);
    const fallbackModel = getFallbackModel(model, 0);

    if ((status === 429 || status === 401) && retryCount < MAX_RETRIES) {
      if (nextKey && nextKey !== key) {
        console.warn(`OpenRouter key issue or rate limit hit. Retrying with fallback key in ${retryDelay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return callOpenRouter(model, prompt, maxTokens, nextKeyAttempt);
      }

      if (fallbackModel) {
        console.warn(`Model rate limited or unavailable. Retrying with fallback model ${fallbackModel} in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return callOpenRouter(fallbackModel, prompt, maxTokens, retryCount + 1);
      }

      console.warn(`Retrying OpenRouter request after ${retryDelay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return callOpenRouter(model, prompt, maxTokens, retryCount + 1);
    }

    // Log detailed error for debugging
    console.error('OpenRouter API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    throw error;
  }
}

function parseJsonFromAI(text) {
  if (typeof text !== 'string') return text;
  const cleaned = text.replace(/```json\s*|```/gi, '').trim();
  return JSON.parse(cleaned);
}

function normalizeClientProfile(lead) {
  if (!lead || typeof lead !== 'object') return null;
  return {
    companyName: lead.companyName || lead.company || '',
    industry: lead.industry || '',
    location: lead.location || 'India',
    likelyNeed: lead.likelyNeed || lead.painPoint || lead.projectType || '',
    decisionMaker: lead.decisionMaker || lead.contactPerson || '',
    estimatedBudget: lead.estimatedBudget || '',
  };
}

/**
 * Feature 1: Client Finder
 * Generates 10 realistic Indian client profiles from selected skills
 */
exports.findClients = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skills = [] } = req.body;
    const skillsList = skills.join(', ');

    const prompt = `You are an expert B2B lead researcher focused on the Indian market (₹ budgets, Indian cities).
Generate exactly 10 realistic potential client profiles for a freelancer/consultant with these skills: ${skillsList}.

Each company should plausibly need work matching those skills (web apps, cloud, ML, DevOps, etc.).
Use varied industries (fintech, healthtech, edtech, logistics, SaaS, D2C, etc.) and Indian cities.

Return ONLY a valid JSON array with exactly 10 objects. Each object must use these exact keys:
{
  "companyName": "Company Name",
  "industry": "Industry",
  "location": "City, India",
  "likelyNeed": "What they likely need from this freelancer",
  "decisionMaker": "Full Name, Job Title",
  "estimatedBudget": "₹ budget range e.g. ₹2–5 Lakhs"
}

No markdown, no extra text.`;

    const result = await callOpenRouterWithFailover({
      model: MODELS.CLIENT_FINDER,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.75,
    });

    let leads;
    try {
      leads = parseJsonFromAI(result);
      if (!Array.isArray(leads)) {
        leads = [leads];
      }
      leads = leads.map(normalizeClientProfile).filter((c) => c && c.companyName);
    } catch (parseError) {
      return res.status(502).json({
        success: false,
        error: 'AI returned an invalid format. Please try again.',
      });
    }

    res.json({
      success: true,
      model: MODELS.CLIENT_FINDER,
      data: leads,
      skills,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify client profile genuineness / scam risk (single or batch)
 */
exports.verifyClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const single = req.body.clientProfile;
    const batch = Array.isArray(req.body.clients) ? req.body.clients : null;
    const profiles = batch
      ? batch.map((c) => normalizeClientProfile(c)).filter((c) => c?.companyName)
      : single
        ? [normalizeClientProfile(single)]
        : [];

    if (profiles.length === 0) {
      return res.status(400).json({ success: false, error: 'clientProfile or clients array is required' });
    }

    const clientListText = profiles
      .map(
        (c, i) =>
          `[${i}] Company: ${c.companyName} | Industry: ${c.industry} | Location: ${c.location} | Decision maker: ${c.decisionMaker} | Need: ${c.likelyNeed} | Budget: ${c.estimatedBudget}`
      )
      .join('\n');

    const prompt = `You are a B2B fraud analyst helping freelancers avoid scam or fake client leads in India.

Evaluate each client profile below for legitimacy and scam risk. Score these dimensions:
1. Company legitimacy — company name + industry + location coherence
2. Decision maker validity — realistic name and professional title
3. Budget realism — ₹ budget plausible for the stated need
4. Need consistency — likely need fits the industry
5. Overall scam risk — vague, mismatched, or too-good-to-be-true signals

CLIENT PROFILES:
${clientListText}

Return ONLY valid JSON (no markdown):
{
  "results": [
    {
      "index": 0,
      "trustScore": 87,
      "summary": "One sentence overall assessment",
      "scamRiskNote": "Main risk note or 'None significant'",
      "checks": [
        { "key": "companyLegitimacy", "status": "pass", "label": "Company looks legitimate" },
        { "key": "decisionMaker", "status": "warn", "label": "Decision maker title seems generic" },
        { "key": "budgetRealism", "status": "pass", "label": "Budget is realistic" },
        { "key": "needConsistency", "status": "pass", "label": "Need matches industry" },
        { "key": "scamRisk", "status": "pass", "label": "No major scam red flags" }
      ]
    }
  ]
}

Rules:
- trustScore is 0-100 integer (80-100 high trust, 50-79 medium, 0-49 suspicious)
- status per check: "pass", "warn", or "fail"
- Return exactly ${profiles.length} result(s) with matching index 0..${profiles.length - 1}`;

    let parsed;
    try {
      const result = await callOpenRouterWithFailover({
        model: MODELS.CLIENT_VERIFIER,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: profiles.length > 1 ? 2000 : 800,
        temperature: 0.2,
      });
      parsed = parseJsonFromAI(result);
    } catch (aiError) {
      const fallback = profiles.map((c, i) => buildDefaultVerification(c, i, 'AI verification failed'));
      return res.json({
        success: true,
        results: batch ? fallback : fallback[0],
        verification: batch ? undefined : fallback[0],
        warning: 'Used fallback scores because AI verification failed',
      });
    }

    let rawResults = parsed?.results || (Array.isArray(parsed) ? parsed : [parsed]);
    const results = profiles.map((profile, index) => {
      const match =
        rawResults.find((r) => Number(r.index) === index) || rawResults[index] || {};
      return normalizeVerificationResult({ ...match, index }, index);
    });

    res.json({
      success: true,
      model: MODELS.CLIENT_VERIFIER,
      results: batch ? results : undefined,
      verification: batch ? undefined : results[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 2: Outreach Generator
 * Generates a personalized cold outreach email for a selected client profile.
 */
exports.generateOutreach = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientProfile, skills = [], senderName = 'Your Name', trustScore } = req.body;
    const profile = clientProfile || {};
    const companyName = profile.companyName || profile.company || '';

    if (typeof trustScore === 'number' && trustScore < 50) {
      return res.status(403).json({
        success: false,
        error: 'This client has been flagged as suspicious. Email sending is disabled.',
      });
    }

    const prompt = `You are a highly professional freelance consultant who generates personalized outreach emails for prospective clients in India.
Write a concise cold email with a strong subject line and body that speaks directly to this client profile:
- Company: ${companyName || 'Unknown Company'}
- Industry: ${profile.industry || 'Unknown Industry'}
- Location: ${profile.location || 'India'}
- Decision maker: ${profile.decisionMaker || 'Decision Maker'}
- Likely need: ${profile.likelyNeed || 'a relevant service need'}
- Estimated budget: ${profile.estimatedBudget || 'a reasonable ₹ budget'}
The email should:
- Mention the client’s industry pain point
- Highlight relevant skills: ${skills.length > 0 ? skills.join(', ') : 'React.js, Node.js, AWS'}
- Use Indian business tone and make a clear CTA for a quick call
Return ONLY valid JSON exactly like:
{
  "subject": "Your subject line here",
  "body": "Email body here"
}`;

    const result = await callOpenRouterWithFailover({
      model: MODELS.EMAIL_DRAFTER,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
      temperature: 0.7,
    });

    let outreachData;
    try {
      outreachData = typeof result === 'string' ? JSON.parse(result) : result;
    } catch (parseError) {
      throw new Error('Unable to parse outreach response from AI.');
    }

    const outreach = new Outreach({
      user: req.user.id,
      companyName,
      industry: profile.industry || '',
      location: profile.location || '',
      likelyNeed: profile.likelyNeed || '',
      decisionMaker: profile.decisionMaker || '',
      estimatedBudget: profile.estimatedBudget || '',
      skills,
      emailSubject: outreachData.subject || '',
      emailBody: outreachData.body || '',
      status: 'drafted',
    });
    await outreach.save();

    res.json({
      success: true,
      model: MODELS.EMAIL_DRAFTER,
      outreach: outreachData,
      recordId: outreach._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 2: Proposal Writer
 * Generates a complete professional proposal with all sections
 * Uses: mistralai/mistral-small-24b-instruct-2501:free (structured, professional writing)
 */
exports.writeProposal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clientName, company, scope, budget, timeline, technologies, yourName, brand } = req.body;

    const prompt = `Write a professional project proposal with the following structure. Use clear, persuasive language.

CLIENT: ${clientName}
COMPANY: ${company}
PROJECT SCOPE: ${scope}
PROPOSED BUDGET: ${budget}
TIMELINE: ${timeline}
KEY TECHNOLOGIES: ${technologies || 'Not specified'}
YOUR NAME/BRAND: ${yourName || brand || 'Your Company'}

Structure the proposal with these exact sections:
1. Introduction (2-3 sentences greeting and company intro)
2. Understanding of the Project (2-3 sentences on what we understood)
3. Proposed Solution & Tech Stack (3-4 sentences detailing approach)
4. Deliverables (Bullet list of specific outputs)
5. Timeline (Key milestones with dates)
6. Investment & Pricing (Clear pricing breakdown)
7. Why Choose Us (2-3 sentences on our unique value)
8. Next Steps (Clear call to action)

Make it professional, persuasive, and ready to send to a client.`;

    const result = await callOpenRouter(MODELS.PROPOSAL_WRITER, prompt, 2000);

    res.json({
      success: true,
      model: MODELS.PROPOSAL_WRITER,
      proposal: result,
      clientData: { clientName, company },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 3: Email Drafter
 * Generates short, concise emails under 120 words with subject line
 * Uses: google/gemma-4-31b-it:free (excellent at concise instruction-following)
 */
exports.draftEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, recipientName, company, context, tone = 'professional' } = req.body;

    const emailTypeGuide = {
      'cold_outreach': 'A first contact email to a prospect introducing your services.',
      'follow_up': 'A follow-up email after a previous conversation or proposal.',
      'proposal_email': 'An email sending a proposal for review with next steps.',
      'thank_you': 'A thank you email after winning a project or completing work.',
    };

    const prompt = `Write a short, professional ${type} email. STRICT REQUIREMENTS:
- Recipient: ${recipientName} at ${company || 'their company'}
- Email type: ${emailTypeGuide[type] || type}
- Context: ${context || 'No specific context provided'}
- Tone: ${tone}
- MUST be under 120 words
- Include a clear subject line

Format the response exactly as:
SUBJECT: [subject line here]
---
[email body here]

Keep it concise, friendly, and action-oriented. No fluff.`;

    const result = await callOpenRouter(MODELS.EMAIL_DRAFTER, prompt, 500);

    // Parse subject and body
    const [subjectLine, emailBody] = result.split('---').map(s => s.trim());

    res.json({
      success: true,
      model: MODELS.EMAIL_DRAFTER,
      email: {
        subject: subjectLine.replace('SUBJECT:', '').trim(),
        body: emailBody,
      },
      wordCount: emailBody.split(/\s+/).length,
    });
  } catch (error) {
    next(error);
  }
};

const CHAT_MAX_MESSAGE_CHARS = 8000;
const CHAT_MAX_TURNS = 24;

function trimConversationForChat(conversation) {
  if (!Array.isArray(conversation)) return [];
  return conversation
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && m.content)
    .map((m) => ({
      role: m.role,
      content: String(m.content).trim().slice(0, CHAT_MAX_MESSAGE_CHARS),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-CHAT_MAX_TURNS);
}

/**
 * Feature 4: AI Chatbot
 * Multi-turn conversational AI with memory of conversation history
 * Uses: meta-llama/llama-3.3-70b-instruct:free (best conversational ability)
 */
exports.chatAssistant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversation, systemPrompt } = req.body;
    const history = trimConversationForChat(conversation);

    const systemMessage = systemPrompt || `You are an expert AI assistant specializing in:
- Freelance client acquisition strategies
- Professional proposal writing
- Pricing strategy for Indian market (₹ rates)
- Tech stack recommendations
- Client objection handling
- Lead qualification and scoring
- Small business growth tactics

Be conversational, helpful, and provide actionable advice. Keep each reply focused and under roughly 800 words unless the user asks for a deep dive.`;

    const messages = [{ role: 'system', content: systemMessage }, ...history];

    // Full non-streaming call (failover rotation works); then simulate SSE-style chunks
    const assistantText = await callOpenRouterWithFailover({
      model: MODELS.AI_CHATBOT,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const text =
      typeof assistantText === 'string'
        ? assistantText
        : assistantText?.content || JSON.stringify(assistantText);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const tokens = text.split(/(\s+)/).filter(Boolean);
    for (let i = 0; i < tokens.length; i += 1) {
      res.write(tokens[i]);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return next(error);
    }
    res.end();
  }
};

/**
 * Feature 5: Lead Scoring
 * Analyzes lead data and assigns fit score with reasoning
 * Uses: deepseek/deepseek-v4-flash:free (superior reasoning, fast JSON output)
 */
exports.scoreLead = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { companyName, industry, size, budget, painPoint, yourServices } = req.body;

    const prompt = `Analyze this lead and return a JSON score. Your response must be ONLY valid JSON, nothing else.

LEAD DATA:
- Company: ${companyName}
- Industry: ${industry}
- Size: ${size}
- Budget: ${budget}
- Main Pain Point: ${painPoint}

YOUR SERVICES: ${yourServices}

Return this exact JSON structure (no markdown, no extra text):
{
  "fitScore": 75,
  "fitReason": "Clear explanation of why this is or isn't a good fit",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "concerns": ["Concern 1", "Concern 2"],
  "nextSteps": ["Action 1", "Action 2"],
  "estimatedDealSize": "$5000-15000",
  "closureProbability": "65%",
  "recommendation": "Contact immediately" or "Follow up later" or "Not a good fit"
}`;

    const result = await callOpenRouter(MODELS.LEAD_SCORER, prompt, 800);

    // Parse JSON response
    let scoreData;
    try {
      scoreData = JSON.parse(result);
    } catch (e) {
      // If parsing fails, return raw result
      scoreData = { raw: result };
    }

    res.json({
      success: true,
      model: MODELS.LEAD_SCORER,
      score: scoreData,
      leadData: { companyName, industry, size },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Feature 6: Security Checker
 * Analyzes code or config for vulnerabilities and OWASP issues
 * Uses: qwen/qwen3-coder:free (specialized in code analysis)
 */
exports.checkSecurity = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, type = 'general', framework = 'nodejs' } = req.body;

    // Limit code length to prevent excessive token usage
    if (code.length > 10000) {
      return res.status(400).json({ error: 'Code snippet too large. Maximum 10000 characters.' });
    }

    const prompt = `You are a security expert. Analyze this ${framework} ${type} code for vulnerabilities and OWASP Top 10 issues.

CODE:
\`\`\`${framework}
${code}
\`\`\`

Provide a security analysis in this JSON format:
{
  "vulnerabilities": [
    {
      "issue": "Issue name",
      "severity": "CRITICAL/HIGH/MEDIUM/LOW",
      "location": "Line/section where issue is",
      "description": "What's wrong and why it's a security risk",
      "fix": "How to fix it"
    }
  ],
  "owasp_issues": ["OWASP issue 1", "OWASP issue 2"],
  "overall_score": 65,
  "summary": "Brief summary of findings",
  "recommendations": ["Top recommendation 1", "Top recommendation 2"]
}

Return ONLY valid JSON, no markdown formatting.`;

    const result = await callOpenRouter(MODELS.SECURITY_CHECKER, prompt, 1500);

    // Parse JSON response
    let securityData;
    try {
      securityData = JSON.parse(result);
    } catch (e) {
      securityData = { raw: result };
    }

    res.json({
      success: true,
      model: MODELS.SECURITY_CHECKER,
      analysis: securityData,
      codeLength: code.length,
    });
  } catch (error) {
    next(error);
  }
};

// Export models for reference in routes
exports.MODELS = MODELS;
