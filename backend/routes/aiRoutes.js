const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const {
  findClients,
  writeProposal,
  draftEmail,
  generateOutreach,
  verifyClient,
  chatAssistant,
  scoreLead,
  checkSecurity,
  MODELS,
} = require('../controllers/aiController');

const router = express.Router();

/**
 * Per-user rate limiting (30 requests per 15 minutes)
 * Uses userId as the key so each authenticated user has their own rate limit
 */
const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window per user
  keyGenerator: (req) => {
    // auth runs before this; per-user limit by MongoDB user id
    return String(req.user.id);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many AI requests. You have 30 requests per 15 minutes. Please try again later.',
    });
  },
  skip: (req, res) => !req.user, // Skip rate limit if not authenticated
});

/**
 * Middleware to validate auth and check API key is configured
 */
const validateAISetup = (req, res, next) => {
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  const primaryKey = process.env.OPENROUTER_API_KEY?.trim();
  const fallbackKey = process.env.OPENROUTER_API_KEY_FALLBACK?.trim();

  const isDeepSeekValid =
    deepseekKey &&
    deepseekKey.startsWith('sk-') &&
    deepseekKey.length > 20 &&
    !deepseekKey.toLowerCase().includes('your-key');
  const isPrimaryValid = primaryKey && primaryKey !== 'sk-or-v1-your-key-here' && !primaryKey.includes('your-key');
  const isFallbackValid = fallbackKey && fallbackKey !== 'sk-or-v1-your-key-here' && !fallbackKey.includes('your-key');

  if (!isDeepSeekValid && !isPrimaryValid && !isFallbackValid) {
    return res.status(500).json({
      success: false,
      error:
        'AI service is not configured. Set DEEPSEEK_API_KEY (primary) and/or OPENROUTER_API_KEY in backend/.env.',
    });
  }
  next();
};

/**
 * POST /api/ai/find-clients
 * Generate 10 Indian client profiles from selected skills
 */
router.post(
  '/find-clients',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('skills')
      .isArray({ min: 1 })
      .withMessage('Select at least one skill'),
    body('skills.*')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Each skill must be 2-100 characters'),
  ],
  findClients
);

/**
 * POST /api/ai/verify-client
 * AI genuineness / scam check for one or more client profiles
 */
router.post(
  '/verify-client',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('clientProfile').optional().isObject(),
    body('clientProfile.companyName').optional().trim().isLength({ max: 200 }),
    body('clientProfile.company').optional().trim().isLength({ max: 200 }),
    body('clients').optional().isArray({ max: 15 }),
    body('clients.*.companyName').optional().trim(),
    body('clients.*.industry').optional().trim(),
    body('clients.*.location').optional().trim(),
    body('clients.*.likelyNeed').optional().trim(),
    body('clients.*.decisionMaker').optional().trim(),
    body('clients.*.estimatedBudget').optional().trim(),
  ],
  (req, res, next) => {
    if (!req.body.clientProfile && (!req.body.clients || req.body.clients.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Provide clientProfile or clients array',
      });
    }
    next();
  },
  verifyClient
);

/**
 * POST /api/ai/generate-outreach
 * Generate a personalized outreach email for a selected client profile
 */
router.post(
  '/generate-outreach',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('clientProfile').notEmpty().withMessage('Client profile is required'),
    body('clientProfile.companyName')
      .optional()
      .trim()
      .isLength({ max: 200 }),
    body('clientProfile.company')
      .optional()
      .trim()
      .isLength({ max: 200 }),
    body('clientProfile')
      .custom((profile) => {
        const name = profile?.companyName || profile?.company;
        if (!name || !String(name).trim()) {
          throw new Error('Company name is required');
        }
        return true;
      }),
    body('clientProfile.industry').notEmpty().withMessage('Industry is required').trim(),
    body('clientProfile.location').notEmpty().withMessage('Location is required').trim(),
    body('clientProfile.likelyNeed').notEmpty().withMessage('Likely need is required').trim(),
    body('clientProfile.decisionMaker').notEmpty().withMessage('Decision maker is required').trim(),
    body('clientProfile.estimatedBudget').notEmpty().withMessage('Estimated budget is required').trim(),
    body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
    body('skills.*').trim().isLength({ min: 2, max: 100 }).withMessage('Each skill must be 2-100 characters'),
    body('senderName').optional().trim().isLength({ max: 100 }).withMessage('Sender name must be max 100 characters'),
  ],
  generateOutreach
);

/**
 * POST /api/ai/write-proposal
 * Generate a complete professional proposal document
 * Model: mistralai/mistral-small-24b-instruct-2501:free (professional structure)
 */
router.post(
  '/write-proposal',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('clientName')
      .notEmpty()
      .withMessage('Client name is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Client name must be between 2 and 100 characters'),
    body('company')
      .notEmpty()
      .withMessage('Company name is required')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Company name must be between 2 and 150 characters'),
    body('scope')
      .notEmpty()
      .withMessage('Project scope is required')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Scope must be between 10 and 1000 characters'),
    body('budget')
      .notEmpty()
      .withMessage('Budget is required')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Budget must be between 3 and 100 characters'),
    body('timeline')
      .notEmpty()
      .withMessage('Timeline is required')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Timeline must be between 3 and 100 characters'),
    body('technologies')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Technologies must be max 300 characters'),
    body('yourName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Your name must be max 100 characters'),
    body('brand')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Brand must be max 100 characters'),
  ],
  writeProposal
);

/**
 * POST /api/ai/draft-email
 * Generate a short, concise email with subject line (max 120 words)
 * Model: google/gemma-4-31b-it:free (concise, instruction-tuned)
 * Types: cold_outreach, follow_up, proposal_email, thank_you
 */
router.post(
  '/draft-email',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('type')
      .notEmpty()
      .withMessage('Email type is required')
      .isIn(['cold_outreach', 'follow_up', 'proposal_email', 'thank_you'])
      .withMessage('Email type must be one of: cold_outreach, follow_up, proposal_email, thank_you'),
    body('recipientName')
      .notEmpty()
      .withMessage('Recipient name is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Recipient name must be between 2 and 100 characters'),
    body('company')
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage('Company must be max 150 characters'),
    body('context')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Context must be max 500 characters'),
    body('tone')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Tone must be max 50 characters'),
  ],
  draftEmail
);

/**
 * POST /api/ai/chat
 * Multi-turn conversational AI with memory and system prompt
 * Model: meta-llama/llama-3.3-70b-instruct:free (best conversational)
 * Body: { conversation: [{role: 'user', content: '...'}, ...], systemPrompt: '...' }
 */
router.post(
  '/chat',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('conversation')
      .isArray()
      .withMessage('Conversation must be an array')
      .notEmpty()
      .withMessage('Conversation array cannot be empty'),
    body('conversation.*.role')
      .isIn(['user', 'assistant'])
      .withMessage('Message role must be "user" or "assistant"'),
    body('conversation.*.content')
      .trim()
      .isLength({ min: 1, max: 12000 })
      .withMessage('Message content must be between 1 and 12000 characters'),
    body('systemPrompt')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('System prompt must be max 2000 characters'),
  ],
  chatAssistant
);

/**
 * POST /api/ai/score-lead
 * Analyze and score lead with fit analysis and recommendation
 * Model: deepseek/deepseek-v4-flash:free (superior reasoning for scoring)
 */
router.post(
  '/score-lead',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('companyName')
      .notEmpty()
      .withMessage('Company name is required')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Company name must be between 2 and 150 characters'),
    body('industry')
      .notEmpty()
      .withMessage('Industry is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Industry must be between 2 and 100 characters'),
    body('size')
      .notEmpty()
      .withMessage('Company size is required')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Size must be between 2 and 50 characters'),
    body('budget')
      .notEmpty()
      .withMessage('Budget is required')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Budget must be between 3 and 100 characters'),
    body('painPoint')
      .notEmpty()
      .withMessage('Pain point is required')
      .trim()
      .isLength({ min: 5, max: 300 })
      .withMessage('Pain point must be between 5 and 300 characters'),
    body('yourServices')
      .notEmpty()
      .withMessage('Your services description is required')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Services must be between 10 and 500 characters'),
  ],
  scoreLead
);

/**
 * POST /api/ai/security-check
 * Analyze code for vulnerabilities and OWASP Top 10 issues
 * Model: qwen/qwen3-coder:free (specialized in code analysis)
 * Max code length: 10,000 characters to prevent token overload
 */
router.post(
  '/security-check',
  auth,
  userRateLimiter,
  validateAISetup,
  [
    body('code')
      .notEmpty()
      .withMessage('Code snippet is required')
      .trim()
      .isLength({ min: 10, max: 10000 })
      .withMessage('Code must be between 10 and 10000 characters'),
    body('framework')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Framework must be max 50 characters'),
    body('type')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Type must be max 50 characters'),
  ],
  checkSecurity
);

/**
 * GET /api/ai/models
 * Return available models and their purposes (for frontend reference)
 */
router.get('/models', auth, (req, res) => {
  res.json({
    success: true,
    models: MODELS,
    info: {
      clientFinder: 'meta-llama/llama-3.3-70b - Most creative for lead generation',
      proposalWriter: 'mistral-small - Professional structured writing',
      emailDrafter: 'gemma-4 - Concise instruction-following',
      chatbot: 'meta-llama/llama-3.3-70b - Best conversational',
      leadScorer: 'deepseek-v4-flash - Superior reasoning',
      securityChecker: 'qwen3-coder - Code analysis specialist',
    },
  });
});

module.exports = router;
