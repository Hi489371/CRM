import api from './api';

/**
 * Frontend AI Service - Calls backend /api/ai/* endpoints
 * All errors are caught and converted to user-friendly messages
 * Token is automatically attached from localStorage by axios interceptor
 */

// Helper to format API errors into user-friendly messages
const formatError = (error) => {
  if (error.response?.status === 429) {
    return 'Too many requests. You have 30 requests per 15 minutes. Please wait a moment.';
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.errors) {
    // Express-validator errors
    return error.response.data.errors.map(e => e.msg).join('; ');
  }
  if (error.response?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  }
  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred';
};

/**
 * Feature 1: Client Finder
 * Generates 10 Indian client profiles from selected skills
 */
export const findClients = async (skills) => {
  try {
    if (!Array.isArray(skills) || skills.length === 0) {
      throw new Error('Select at least one skill');
    }

    const response = await api.post('/ai/find-clients', {
      skills: skills.map((s) => String(s).trim()).filter(Boolean),
    });

    return {
      success: true,
      data: response.data.data,
      model: response.data.model,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Verify client genuineness (batch — pass array of client profiles)
 */
export const verifyClients = async (clients) => {
  try {
    if (!Array.isArray(clients) || clients.length === 0) {
      throw new Error('At least one client profile is required');
    }

    const response = await api.post('/ai/verify-client', { clients });

    return {
      success: true,
      results: response.data.results || [],
      warning: response.data.warning,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Verify a single client profile
 */
export const verifyClient = async (clientProfile) => {
  try {
    const response = await api.post('/ai/verify-client', { clientProfile });
    return {
      success: true,
      verification: response.data.verification,
      warning: response.data.warning,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

export const generateOutreach = async (clientProfile, skills, senderName = 'Your Name') => {
  try {
    const companyName = clientProfile?.companyName || clientProfile?.company;
    if (!clientProfile || !companyName) {
      throw new Error('Client profile is required to generate outreach.');
    }
    if (!Array.isArray(skills) || skills.length === 0) {
      throw new Error('At least one skill is required to generate outreach.');
    }

    const response = await api.post('/ai/generate-outreach', {
      clientProfile: {
        ...clientProfile,
        companyName,
      },
      skills,
      senderName,
      trustScore: clientProfile.trustScore ?? clientProfile.verification?.trustScore,
    });

    return {
      success: true,
      outreach: response.data.outreach,
      recordId: response.data.recordId,
      model: response.data.model,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Feature 2: Proposal Writer
 * Generates a complete professional proposal
 */
export const writeProposal = async (clientName, company, scope, budget, timeline, technologies, yourName, brand) => {
  try {
    if (!clientName || !company || !scope || !budget || !timeline) {
      throw new Error('Client name, company, scope, budget, and timeline are required');
    }

    const response = await api.post('/ai/write-proposal', {
      clientName: clientName.trim(),
      company: company.trim(),
      scope: scope.trim(),
      budget: budget.trim(),
      timeline: timeline.trim(),
      technologies: technologies || '',
      yourName: yourName || '',
      brand: brand || '',
    });

    return {
      success: true,
      proposal: response.data.proposal,
      model: response.data.model,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Feature 3: Email Drafter
 * Generates short emails (under 120 words) with subject line
 * Types: cold_outreach, follow_up, proposal_email, thank_you
 */
export const draftEmail = async (type, recipientName, company, context, tone = 'professional') => {
  try {
    if (!type || !recipientName) {
      throw new Error('Email type and recipient name are required');
    }

    const validTypes = ['cold_outreach', 'follow_up', 'proposal_email', 'thank_you'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid email type. Must be one of: ${validTypes.join(', ')}`);
    }

    const response = await api.post('/ai/draft-email', {
      type,
      recipientName: recipientName.trim(),
      company: company ? company.trim() : '',
      context: context ? context.trim() : '',
      tone: tone || 'professional',
    });

    return {
      success: true,
      subject: response.data.email.subject,
      body: response.data.email.body,
      wordCount: response.data.wordCount,
      model: response.data.model,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Feature 4: AI Chatbot
 * Multi-turn conversation with memory and system prompt
 * conversation: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}, ...]
 */
export const chatWithAI = async (conversation, systemPrompt = null) => {
  try {
    if (!Array.isArray(conversation) || conversation.length === 0) {
      throw new Error('Conversation array cannot be empty');
    }

    // Validate conversation format
    const isValidConversation = conversation.every(
      msg => msg.role && ['user', 'assistant'].includes(msg.role) && msg.content
    );
    if (!isValidConversation) {
      throw new Error('Invalid conversation format. Each message must have role and content.');
    }

    const response = await api.post('/ai/chat', {
      conversation,
      systemPrompt: systemPrompt || undefined,
    });

    return {
      success: true,
      response: response.data.response,
      model: response.data.model,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Feature 5: Lead Scoring
 * Analyzes lead fit with scoring and recommendations
 */
export const scoreLead = async (companyName, industry, size, budget, painPoint, yourServices) => {
  try {
    if (!companyName || !industry || !size || !budget || !painPoint || !yourServices) {
      throw new Error('All fields are required: company, industry, size, budget, pain point, services');
    }

    const response = await api.post('/ai/score-lead', {
      companyName: companyName.trim(),
      industry: industry.trim(),
      size: size.trim(),
      budget: budget.trim(),
      painPoint: painPoint.trim(),
      yourServices: yourServices.trim(),
    });

    return {
      success: true,
      score: response.data.score,
      model: response.data.model,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Feature 6: Security Checker
 * Analyzes code for vulnerabilities and OWASP issues
 * framework: nodejs, python, javascript, java, general
 * type: general, express-server, react-app, api
 */
export const checkCodeSecurity = async (code, framework = 'nodejs', type = 'general') => {
  try {
    if (!code || code.trim().length < 10) {
      throw new Error('Code snippet must be at least 10 characters');
    }

    if (code.length > 10000) {
      throw new Error('Code snippet is too large (max 10,000 characters)');
    }

    const response = await api.post('/ai/security-check', {
      code: code.trim(),
      framework: framework || 'nodejs',
      type: type || 'general',
    });

    return {
      success: true,
      analysis: response.data.analysis,
      codeLength: response.data.codeLength,
      model: response.data.model,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

/**
 * Get available models and their purposes
 */
export const getAvailableModels = async () => {
  try {
    const response = await api.get('/ai/models');
    return {
      success: true,
      models: response.data.models,
      info: response.data.info,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
};

// Export all functions
const aiService = {
  findClients,
  verifyClients,
  verifyClient,
  writeProposal,
  draftEmail,
  chatWithAI,
  scoreLead,
  checkCodeSecurity,
  generateOutreach,
  getAvailableModels,
};

export default aiService;
