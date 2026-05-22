import React, { useState } from 'react';
import { draftEmail } from '../services/aiService';

// Page: Email Drafter
// Supports multiple email types and generates a concise email under 120 words.
const EmailDrafter = () => {
  const [type, setType] = useState('cold_outreach');
  const [form, setForm] = useState({ recipientName: '', company: '', context: '', tone: 'professional' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    const res = await draftEmail(type, form.recipientName, form.company, form.context, form.tone);
    if (res.success) {
      setResult(res);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      const emailText = `Subject: ${result.subject}\n\n${result.body}`;
      await navigator.clipboard.writeText(emailText);
      alert('Email copied to clipboard!');
    } catch (err) {
      console.error(err);
      alert('Copy failed');
    }
  };

  return (
    <div>
      <h2>AI Email Drafter</h2>
      <form onSubmit={handleGenerate}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="cold_outreach">Cold outreach</option>
          <option value="follow_up">Follow-up</option>
          <option value="proposal_email">Proposal email</option>
          <option value="thank_you">Thank you / project won</option>
        </select>

        <input name="recipientName" placeholder="Recipient name" value={form.recipientName} onChange={handleChange} required />
        <input name="company" placeholder="Company (optional)" value={form.company} onChange={handleChange} />
        <input name="tone" placeholder="Tone (e.g., professional, friendly)" value={form.tone} onChange={handleChange} />
        <textarea name="context" placeholder="Context details (optional)" value={form.context} onChange={handleChange} />
        <button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate Email'}</button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 20 }}>{error}</p>}
      
      {result && (
        <div style={{ marginTop: 20 }}>
          <button onClick={copyToClipboard}>Copy to clipboard</button>
          <div style={{ border: '1px solid #ddd', padding: 10, marginTop: 10 }}>
            <strong>Subject:</strong> {result.subject}
            <hr />
            <strong>Email Body ({result.wordCount} words):</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{result.body}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDrafter;
