# OpenRouter Model Guide - CRM AI Platform

## Overview

This CRM platform uses **OpenRouter.ai** as the AI provider instead of a single provider. OpenRouter gives you access to multiple free AI models, each optimized for different tasks. By using the right model for each task, we get better results at zero cost.

### Why OpenRouter?

- **Multiple Models**: Access 6+ free AI models, each with different strengths
- **Cost-Effective**: All models used here are free tier on OpenRouter
- **Flexibility**: Easy to swap models if you want to experiment
- **Fallback Ready**: If one model has issues, you can quickly switch to another
- **No Vendor Lock-in**: Not dependent on a single AI provider

---

## Model Selection Table

| Feature | Model | Purpose | Why Chosen | Free Limits | Speed |
|---------|-------|---------|-----------|------------|-------|
| **Client Finder** | `meta-llama/llama-3.3-70b-instruct:free` | Generate 5 realistic potential clients | 70B parameters = most creative; business understanding; JSON output | ~5-10 calls/hour | ~15-20s |
| **Proposal Writer** | `mistralai/mistral-small-24b-instruct-2501:free` | Write full professional proposals | Excellent at structured writing; professional tone; follows instructions precisely | ~10-15 calls/hour | ~10-15s |
| **Email Drafter** | `google/gemma-4-31b-it:free` | Create short emails (< 120 words) | Instruction-tuned; naturally concise output; excellent for short-form content | ~15-20 calls/hour | ~5-10s |
| **AI Chatbot** | `meta-llama/llama-3.3-70b-instruct:free` | Multi-turn conversations | Best conversational ability; excellent at context retention; natural dialogue flow | ~5-10 calls/hour | ~15-20s |
| **Lead Scorer** | `deepseek/deepseek-v4-flash:free` | Analyze & score leads | Superior reasoning for analysis; fast execution; reliable JSON output | ~15-20 calls/hour | ~8-12s |
| **Security Checker** | `qwen/qwen3-coder:free` | Detect code vulnerabilities | Specialized in code analysis; trained on security patterns; OWASP awareness | ~10-15 calls/hour | ~10-15s |

---

## Feature Details

### 1. Client Finder
**Endpoint**: `POST /api/ai/find-clients`

- **Input**: Industry, company size, region, your service offering
- **Output**: 5 leads with company, contact, email, pain point, fit score
- **Why Llama 3.3 70B?**
  - Largest free model = most creative
  - Excellent business context understanding
  - Consistently produces valid JSON
  - Best for generating realistic personas

### 2. Proposal Writer
**Endpoint**: `POST /api/ai/write-proposal`

- **Input**: Client name, company, scope, budget, timeline, tech stack
- **Output**: Full 8-section professional proposal
- **Why Mistral Small?**
  - Excellent at structured writing
  - Consistently professional tone
  - Follows formatting instructions perfectly
  - Faster than Llama, lower latency
  - Ideal for business documents

### 3. Email Drafter
**Endpoint**: `POST /api/ai/draft-email`

- **Input**: Email type, recipient, company, context
- **Output**: Subject line + email body (< 120 words)
- **Why Gemma 4?**
  - Instruction-tuned: understands "under 120 words" constraint perfectly
  - Natural conciseness: doesn't add fluff
  - Fast response time
  - Excellent for short, punchy writing
  - Less is more approach

### 4. AI Chatbot
**Endpoint**: `POST /api/ai/chat`

- **Input**: Conversation history + system prompt
- **Output**: Single assistant message
- **Why Llama 3.3 70B?**
  - Best conversational model available for free
  - Excellent at maintaining context across turns
  - Natural dialogue flow
  - Handles complex questions well
  - System prompt integration works perfectly

### 5. Lead Scoring
**Endpoint**: `POST /api/ai/score-lead`

- **Input**: Company details, industry, budget, pain point, your services
- **Output**: Fit score (0-100), reasoning, strengths, concerns, recommendation
- **Why DeepSeek V4 Flash?**
  - Superior reasoning capabilities for analysis
  - Fast JSON output
  - Excellent at identifying fit/misfit reasons
  - Balances speed and quality
  - Reliable scoring logic

### 6. Security Checker
**Endpoint**: `POST /api/ai/security-check`

- **Input**: Code snippet (Node.js, Python, React, etc.)
- **Output**: Vulnerabilities list, OWASP issues, recommendations
- **Why Qwen3 Coder?**
  - Specialized in code analysis
  - Trained on security patterns
  - Understands common vulnerabilities
  - OWASP Top 10 awareness built-in
  - Best code interpreter of the free models

---

## Free Tier Rate Limits

OpenRouter free tier has per-model rate limits. This is why we use different models for different tasks:

- **Llama 3.3 70B**: ~5-10 calls/hour (used for high-value tasks)
- **Mistral Small**: ~10-15 calls/hour (proposal writing)
- **Gemma 4**: ~15-20 calls/hour (lightweight emails)
- **DeepSeek V4 Flash**: ~15-20 calls/hour (quick scoring)
- **Qwen3 Coder**: ~10-15 calls/hour (code analysis)

**Note**: These limits reset hourly. If you hit a limit, you'll get a 429 error. The backend automatically retries with exponential backoff.

---

## Backend Rate Limiting

Additional rate limiting to protect your API:

```
Per User: 30 requests per 15 minutes
Per Endpoint: Varies (Client Finder = slower model, allows 2-3 requests)
```

This prevents accidental abuse and protects your OpenRouter quota.

---

## How Fallback Works

If one model hits its free tier limit (429 error), the backend automatically:

1. **First attempt**: Use original model
2. **Gets 429**: Waits 2 seconds and retries
3. **2nd attempt**: Retries same model
4. **Still 429**: Waits 4 seconds and retries
5. **3rd attempt**: Final retry
6. **Still fails**: Returns error to frontend

For production, you can implement model fallback by editing `aiController.js`:

```javascript
// Example fallback for Lead Scorer if DeepSeek fails:
async function scoreLeadWithFallback(data) {
  try {
    return await callOpenRouter(MODELS.LEAD_SCORER, prompt, 800);
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('Lead Scorer rate limited, trying Llama...');
      return await callOpenRouter(MODELS.AI_CHATBOT, prompt, 800);
    }
    throw err;
  }
}
```

---

## Swapping Models

To use a different model for any feature:

### Option 1: Via Environment Variables (Recommended)

Add to `.env`:

```
MODEL_CLIENT_FINDER=openrouter/auto
MODEL_PROPOSAL_WRITER=meta-llama/llama-3.3-70b-instruct:free
```

Then update `aiController.js` to read from env:

```javascript
const MODELS = {
  CLIENT_FINDER: process.env.MODEL_CLIENT_FINDER || 'meta-llama/llama-3.3-70b-instruct:free',
  // ... rest of models
};
```

### Option 2: Direct Edit in Code

Edit `backend/controllers/aiController.js`:

```javascript
const MODELS = {
  CLIENT_FINDER: 'your-new-model-name:free',
  // ...
};
```

### Available Free Models on OpenRouter

```
Meta Llama:
  - meta-llama/llama-3.3-70b-instruct:free
  - meta-llama/llama-3.1-70b-instruct:free
  - meta-llama/llama-3-8b-instruct:free

Mistral:
  - mistralai/mistral-small-24b-instruct-2501:free
  - mistralai/mistral-7b-instruct:free

Google:
  - google/gemma-4-31b-it:free
  - google/gemma-3-9b-it:free

DeepSeek:
  - deepseek/deepseek-v4-flash:free

Qwen:
  - qwen/qwen3-coder:free
  - qwen/qwq-32b-preview:free

And many more! See: https://openrouter.ai/models
```

---

## Monitoring & Debugging

### Check if API key is working:

```bash
curl -X GET "https://openrouter.ai/api/v1/models" \
  -H "Authorization: Bearer sk-or-v1-YOUR-KEY"
```

Should return list of available models.

### Monitor rate limits:

Backend logs will show:
```
Rate limited. Retrying in 2000ms... (attempt 1/3)
```

If you see this often, consider:
1. Reducing usage of that model
2. Switching to a different model
3. Upgrading to OpenRouter paid tier

### Check response format:

Each endpoint returns:
```json
{
  "success": true,
  "model": "model-name-used:free",
  "data": { /* specific to endpoint */ }
}
```

### Frontend error handling:

All errors are automatically converted to user-friendly messages:
- 429: "Too many requests. You have 30 requests per 15 minutes..."
- 401: "Your session has expired. Please log in again."
- Network errors: "Network error. Please check your connection."

---

## Best Practices

### 1. Input Validation
All routes validate input before calling OpenRouter:
- Max character limits per field
- Required fields checked
- Email/URL format validated
- Code length limited to 10K characters

### 2. Token Management
- Conversations limited to 2000 characters per message
- Proposals get 2000 tokens max
- Client finder gets 1500 tokens
- Total max per request: varies by model

### 3. Cost Optimization
- Free tier models used exclusively
- Different models for different speeds
- Rate limiting prevents waste
- Retry logic with backoff

### 4. Error Recovery
- Automatic retries for 429 (rate limit)
- Exponential backoff: 2s, 4s, 8s
- Clear error messages to user
- No silent failures

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "AI service not configured" | Set `OPENROUTER_API_KEY` in `.env` |
| 429 Rate Limited errors | Wait 15+ minutes or upgrade to paid tier |
| Model not responding | Check OpenRouter status: https://openrouter.ai/status |
| Invalid JSON response | Model sometimes returns text instead of JSON. Frontend handles gracefully. |
| Proposal too short | Increase max_tokens in aiController.js (currently 2000) |
| Email too long | Gemma is concise but review prompt constraints |

---

## Future Enhancements

Possible improvements:

1. **Model Swapping**: Add admin panel to change models without code
2. **Usage Analytics**: Track tokens used per model per user
3. **Custom Models**: Allow users to train custom models
4. **Streaming**: Stream long responses instead of waiting
5. **Caching**: Cache similar requests to save tokens
6. **A/B Testing**: Compare different models for same task

---

## Support & Resources

- **OpenRouter Docs**: https://openrouter.ai/docs
- **Model Benchmarks**: https://huggingface.co/spaces/open-llm-leaderboard
- **Free Models List**: https://openrouter.ai/models?tab=free
- **API Status**: https://openrouter.io/status

---

**Last Updated**: May 22, 2026  
**Platform Version**: 1.0  
**OpenRouter Status**: Active ✓
