const axios = require('axios');

/**
 * AI client: DeepSeek (primary) → OpenRouter primary → OpenRouter fallback.
 * Non-streaming only; chat simulates streaming after the full response.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY?.trim();
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';
const DEEPSEEK_PLACEHOLDER = 'sk-your-deepseek-key-here';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const OPENROUTER_API_KEY_FALLBACK = process.env.OPENROUTER_API_KEY_FALLBACK?.trim();
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_PLACEHOLDER = 'sk-or-v1-your-key-here';
const KEY_COOLDOWN_MS = 60_000;
const MAX_RETRIES = 3;
const DEFAULT_TEMPERATURE = 0.7;

const keys = [OPENROUTER_API_KEY, OPENROUTER_API_KEY_FALLBACK].filter(isValidOpenRouterKey);
const keyState = {};
keys.forEach((key) => {
  keyState[key] = {
    totalTokens: 0,
    coolingUntil: 0,
    lastUsed: 0,
  };
});

function isValidOpenRouterKey(key) {
  return (
    key &&
    typeof key === 'string' &&
    key.length > 20 &&
    !key.toLowerCase().includes('your-key') &&
    !key.toLowerCase().includes('your-actual') &&
    key !== OPENROUTER_PLACEHOLDER
  );
}

function isValidDeepSeekKey(key) {
  return (
    key &&
    typeof key === 'string' &&
    key.length > 20 &&
    key.startsWith('sk-') &&
    !key.toLowerCase().includes('your-key') &&
    !key.toLowerCase().includes('change-this') &&
    key !== DEEPSEEK_PLACEHOLDER
  );
}

function buildDeepSeekHeaders() {
  return {
    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function tryDeepSeek(payload) {
  if (!isValidDeepSeekKey(DEEPSEEK_API_KEY)) return null;

  const body = {
    model: DEEPSEEK_MODEL,
    messages: payload.messages,
    max_tokens: payload.max_tokens || 1000,
    temperature: payload.temperature ?? DEFAULT_TEMPERATURE,
    stream: false,
  };

  console.log(`[DeepSeek] Attempt 1: ${DEEPSEEK_MODEL}...`);
  const response = await axios.post(DEEPSEEK_BASE_URL, body, {
    headers: buildDeepSeekHeaders(),
    timeout: 60000,
  });

  return response.data?.choices?.[0]?.message?.content ?? response.data;
}

function getAvailableKeys(exclude = []) {
  const now = Date.now();
  return keys.filter((key) => {
    if (!isValidOpenRouterKey(key)) return false;
    if (exclude.includes(key)) return false;
    if (keyState[key]?.coolingUntil > now) return false;
    return true;
  });
}

function selectKey(exclude = []) {
  const activeKeys = getAvailableKeys(exclude);
  if (activeKeys.length === 0) return null;
  if (activeKeys.length === 1) return activeKeys[0];

  const [primary, fallback] = activeKeys;
  const primaryUsage = keyState[primary]?.totalTokens || 0;
  const fallbackUsage = keyState[fallback]?.totalTokens || 0;

  if (primaryUsage <= fallbackUsage + 800) {
    return primary;
  }

  return fallback;
}

function markKeyCooling(key, reason) {
  if (!keyState[key]) return;
  keyState[key].coolingUntil = Date.now() + KEY_COOLDOWN_MS;
  console.warn(`Cooling OpenRouter key for ${KEY_COOLDOWN_MS / 1000}s because: ${reason}`);
}

function recordKeyUsage(key, tokens) {
  if (!keyState[key] || typeof tokens !== 'number' || tokens <= 0) return;
  keyState[key].totalTokens += tokens;
  keyState[key].lastUsed = Date.now();
}

function getKeyStats() {
  return { ...keyState };
}

function buildOpenRouterHeaders(key) {
  return {
    Authorization: `Bearer ${key}`,
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
    'X-Title': 'CRM AI Assistant',
    'Content-Type': 'application/json',
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenRouter(payload, retryAttempt = 0, excludeKeys = []) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('OpenRouter payload must be an object containing model and messages.');
  }

  const initialModel = payload.model;
  if (!initialModel) {
    throw new Error('OpenRouter payload must include a model id.');
  }

  const fallbackKey = OPENROUTER_API_KEY_FALLBACK;
  const validPrimary = isValidOpenRouterKey(OPENROUTER_API_KEY);
  const validFallback = isValidOpenRouterKey(fallbackKey);
  const primaryKey = validPrimary ? OPENROUTER_API_KEY : null;

  const validDeepSeek = isValidDeepSeekKey(DEEPSEEK_API_KEY);

  if (validDeepSeek) {
    try {
      const deepSeekResult = await tryDeepSeek(payload);
      if (deepSeekResult != null) {
        console.log('[DeepSeek] Success');
        return deepSeekResult;
      }
    } catch (error) {
      const status = error.response?.status;
      console.warn(
        `[DeepSeek] Failed (status ${status || 'unknown'}): ${error.message}. Falling back to OpenRouter...`
      );
    }
  }

  if (!validPrimary && !validFallback) {
    if (validDeepSeek) {
      throw new Error('AI is busy right now, please try again in a moment');
    }
    throw new Error(
      'No valid AI API keys. Set DEEPSEEK_API_KEY and/or OPENROUTER_API_KEY in backend/.env.'
    );
  }

  const modelRotation = [
    initialModel,
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-v4-flash:free',
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'qwen/qwen3-coder:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
  ].filter((m, index, self) => m && self.indexOf(m) === index);

  const body = {
    messages: payload.messages,
    max_tokens: payload.max_tokens || 1000,
    temperature: payload.temperature ?? DEFAULT_TEMPERATURE,
    top_p: payload.top_p ?? 0.95,
    stream: false, // never stream — rotation breaks under axios stream + 429
  };

  async function sendRequest(key, keyLabel, modelId, attemptNumber, totalAttempts) {
    console.log(`[OpenRouter] Attempt ${attemptNumber}/${totalAttempts}: ${keyLabel} + ${modelId}...`);
    const response = await axios.post(OPENROUTER_BASE_URL, { ...body, model: modelId }, {
      headers: buildOpenRouterHeaders(key),
      timeout: 60000,
    });

    const usageTokens = response.data?.usage?.total_tokens ?? body.max_tokens ?? 0;
    recordKeyUsage(key, usageTokens);
    return response.data?.choices?.[0]?.message?.content ?? response.data;
  }

  const attempts = [];
  if (validPrimary) {
    for (const modelId of modelRotation) {
      attempts.push({ key: primaryKey, label: 'primary key', modelId });
    }
  }
  if (validFallback) {
    for (const modelId of modelRotation) {
      attempts.push({ key: fallbackKey, label: 'fallback key', modelId });
    }
  }

  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    try {
      return await sendRequest(attempt.key, attempt.label, attempt.modelId, index + 1, attempts.length);
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        console.warn(`[OpenRouter] ERROR: Model not found (404) for attempt ${index + 1}/${attempts.length}, skipping and moving to next.`);
        continue;
      }
      if (status === 429) {
        console.warn(`[OpenRouter] Attempt ${index + 1}/${attempts.length} got 429, moving to next attempt.`);
        continue;
      }

      console.warn(`[OpenRouter] Attempt ${index + 1}/${attempts.length} failed with status ${status || 'unknown'}, moving to next attempt.`);
      continue;
    }
  }

  throw new Error('AI is busy right now, please try again in a moment');
}

module.exports = {
  callOpenRouter,
  getKeyStats,
};
