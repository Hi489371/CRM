# OpenRouter AI Integration - Quick Setup Guide

## What Was Added

This integration adds 6 AI-powered features to your CRM using free OpenRouter models:

1. **Client Finder** - Generate leads from criteria
2. **Proposal Writer** - Write professional proposals
3. **Email Drafter** - Create short emails (< 120 words)
4. **AI Chatbot** - Multi-turn conversations
5. **Lead Scorer** - Analyze and score leads
6. **Security Checker** - Scan code for vulnerabilities

---

## Step 1: Get Your OpenRouter API Key

1. Go to https://openrouter.ai
2. Sign up (free account)
3. Go to Settings → API Keys
4. Copy your key (starts with `sk-or-v1-`)

---

## Step 2: Configure Environment

### Backend (.env)

Copy `.env.example` to `.env` in the `backend/` folder:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add:

```
# Required for AI features
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here

# Email alerts (optional but recommended)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=CRM <noreply@yourcompany.com>

# Other essentials
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_SECRET=your-32-character-secret-key
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend (.env)

Create `frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Step 3: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## Step 4: Start Services

### Terminal 1 - MongoDB
```bash
mongod
```

### Terminal 2 - Backend
```bash
cd backend
npm run dev
```

Backend runs on: `http://localhost:5000`

### Terminal 3 - Frontend
```bash
cd frontend
npm start
```

Frontend runs on: `http://localhost:3000`

---

## Step 5: Test the AI Features

### From Frontend (Recommended)

1. Log in to http://localhost:3000
2. Click on AI tools in sidebar:
   - **Client Finder** - Enter industry, company size, region, offering
   - **Proposal Writer** - Fill in client details
   - **Email Drafter** - Choose email type and recipient
   - **AI Assistant** - Have a conversation
   - **Lead Scorer** - Analyze a lead (feature in backend, needs frontend page)
   - **Security Checker** - Paste code to scan (feature in backend, needs frontend page)

### From API (curl)

```bash
# 1. Get auth token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Response includes token. Use in Authorization header below.

# 2. Find Clients
curl -X POST http://localhost:5000/api/ai/find-clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "industry": "SaaS",
    "companySize": "10-50",
    "region": "US",
    "offering": "Web development and cloud infrastructure"
  }'

# 3. Score a Lead
curl -X POST http://localhost:5000/api/ai/score-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyName": "TechCorp Inc",
    "industry": "Software",
    "size": "50-100 employees",
    "budget": "$10,000-20,000",
    "painPoint": "Needs custom internal tool built",
    "yourServices": "Web development, Node.js, React"
  }'
```

---

## Frontend Page Components (Optional)

If you want complete UI for Lead Scorer and Security Checker, create these pages:

### `frontend/src/pages/LeadScorer.js`

```javascript
import React, { useState } from 'react';
import { scoreLead } from '../services/aiService';

const LeadScorer = () => {
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    size: '',
    budget: '',
    painPoint: '',
    yourServices: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleScore = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await scoreLead(
      form.companyName,
      form.industry,
      form.size,
      form.budget,
      form.painPoint,
      form.yourServices
    );
    setResult(res);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Lead Scorer</h2>
      <form onSubmit={handleScore}>
        <input name="companyName" placeholder="Company Name" value={form.companyName} onChange={handleChange} required />
        <input name="industry" placeholder="Industry" value={form.industry} onChange={handleChange} required />
        <input name="size" placeholder="Company Size" value={form.size} onChange={handleChange} required />
        <input name="budget" placeholder="Budget" value={form.budget} onChange={handleChange} required />
        <textarea name="painPoint" placeholder="Pain Point" value={form.painPoint} onChange={handleChange} required />
        <textarea name="yourServices" placeholder="Your Services" value={form.yourServices} onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? 'Scoring...' : 'Score Lead'}</button>
      </form>

      {result && (
        <div style={{ marginTop: 20, padding: 10, border: '1px solid #ddd' }}>
          {result.success ? (
            <pre>{JSON.stringify(result.score, null, 2)}</pre>
          ) : (
            <p style={{ color: 'red' }}>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadScorer;
```

### `frontend/src/pages/SecurityChecker.js`

```javascript
import React, { useState } from 'react';
import { checkCodeSecurity } from '../services/aiService';

const SecurityChecker = () => {
  const [code, setCode] = useState('');
  const [framework, setFramework] = useState('nodejs');
  const [type, setType] = useState('general');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await checkCodeSecurity(code, framework, type);
    setResult(res);
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Security Checker</h2>
      <form onSubmit={handleCheck}>
        <select value={framework} onChange={(e) => setFramework(e.target.value)}>
          <option>nodejs</option>
          <option>python</option>
          <option>javascript</option>
          <option>general</option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>general</option>
          <option>express-server</option>
          <option>react-app</option>
          <option>api</option>
        </select>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste code here (max 10,000 chars)"
          style={{ width: '100%', height: 300 }}
        />
        <button type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Check Security'}</button>
      </form>

      {result && (
        <div style={{ marginTop: 20, padding: 10, border: '1px solid #ddd' }}>
          {result.success ? (
            <pre>{JSON.stringify(result.analysis, null, 2)}</pre>
          ) : (
            <p style={{ color: 'red' }}>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityChecker;
```

Then add to `frontend/src/App.js`:

```javascript
import LeadScorer from './pages/LeadScorer';
import SecurityChecker from './pages/SecurityChecker';

// Add routes:
<Route path="/ai/score-lead" element={<PrivateRoute><LeadScorer /></PrivateRoute>} />
<Route path="/ai/security" element={<PrivateRoute><SecurityChecker /></PrivateRoute>} />
```

And to `frontend/src/components/Navigation.js`:

```javascript
<Link to="/ai/score-lead" className="nav-link">Lead Scorer</Link>
<Link to="/ai/security" className="nav-link">Security Checker</Link>
```

---

## API Endpoint Reference

### 1. Client Finder
```
POST /api/ai/find-clients
Body: { industry?, companySize?, region?, offering* }
Returns: { success, model, data: [{company, contactPerson, email, painPoint, fitScore, ...}] }
```

### 2. Proposal Writer
```
POST /api/ai/write-proposal
Body: { clientName*, company*, scope*, budget*, timeline*, technologies?, yourName?, brand? }
Returns: { success, model, proposal: "..." }
```

### 3. Email Drafter
```
POST /api/ai/draft-email
Body: { type* (cold_outreach|follow_up|proposal_email|thank_you), recipientName*, company?, context?, tone? }
Returns: { success, model, email: {subject, body}, wordCount }
```

### 4. AI Chatbot
```
POST /api/ai/chat
Body: { conversation* [{role*, content*}], systemPrompt? }
Returns: { success, model, response: "..." }
```

### 5. Lead Scorer
```
POST /api/ai/score-lead
Body: { companyName*, industry*, size*, budget*, painPoint*, yourServices* }
Returns: { success, model, score: {fitScore, fitReason, strengths, concerns, nextSteps, recommendation, ...} }
```

### 6. Security Checker
```
POST /api/ai/security-check
Body: { code* (max 10K chars), framework?, type? }
Returns: { success, model, analysis: {vulnerabilities, owasp_issues, overall_score, recommendations, ...} }
```

### Get Models Info
```
GET /api/ai/models
Returns: { success, models: {...}, info: {...} }
```

---

## Rate Limits

**Per User**: 30 requests per 15 minutes  
**Per Model**: Varies (typically 5-20 calls/hour free tier)

If you hit a limit:
- Frontend shows: "Too many requests. You have 30 requests per 15 minutes..."
- Backend retries automatically (up to 3 times with backoff)

---

## Troubleshooting

### "AI service not configured"
- Check `OPENROUTER_API_KEY` is in `backend/.env`
- Verify it's a valid key (starts with `sk-or-v1-`)

### 429 Rate Limited
- Wait 15 minutes for quota reset
- Upgrade to OpenRouter paid tier for higher limits
- Or use different models (see MODEL_GUIDE.md)

### "Too many AI requests"
- Your user hit 30 requests / 15 minutes limit
- Wait 15 minutes
- Limit applies per-user (different users have separate limits)

### Model not responding
- Check OpenRouter status: https://openrouter.io/status
- Try a different model
- Verify internet connection

### Invalid JSON response
- Rare issue - happens when model returns text instead of JSON
- Backend should fall back to returning raw text
- Frontend handles gracefully

---

## Next Steps

1. **Test all 6 features** - Make sure they work in your environment
2. **Read MODEL_GUIDE.md** - Understand model selection and rate limits
3. **Add custom system prompts** - Customize AI behavior for your business
4. **Monitor usage** - Check backend logs for pattern of usage
5. **Scale up** - When free tier limits are hit, upgrade to OpenRouter paid

---

## Files Changed/Added

**Backend**:
- ✅ `backend/controllers/aiController.js` - Rewritten with 6 features + OpenRouter
- ✅ `backend/routes/aiRoutes.js` - Rewritten with validation + per-user rate limiting
- ✅ `backend/services/emailService.js` - Email alerts (kept from before)
- ✅ `backend/package.json` - Added `express-validator`

**Frontend**:
- ✅ `frontend/src/services/aiService.js` - Rewritten with 6 functions
- ✅ `frontend/src/pages/ClientFinder.js` - Uses new aiService
- ✅ `frontend/src/pages/ProposalWriter.js` - Uses new aiService
- ✅ `frontend/src/pages/EmailDrafter.js` - Uses new aiService
- ✅ `frontend/src/pages/AIChatbot.js` - Uses new aiService

**Config**:
- ✅ `.env.example` - Complete example with all variables
- ✅ `MODEL_GUIDE.md` - Deep dive into model selection
- ✅ `SETUP.md` - This file

---

**Questions?** Check MODEL_GUIDE.md for detailed explanations.  
**Ready to go!** Start the services and test in your browser.
