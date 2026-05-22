import React, { useState } from 'react';
import { findClients, generateOutreach, verifyClients } from '../services/aiService';
import { sendOutreachFromClientFinder } from '../services/leadOutreachService';
import ClientTrustBadge from '../components/ClientTrustBadge';
import {
  getCachedVerification,
  setCachedVerification,
  clearVerificationCache,
  fallbackVerification,
} from '../utils/clientVerificationCache';

const SKILL_OPTIONS = [
  'React.js',
  'Node.js',
  'AWS',
  'GCP',
  'ML/AI',
  'Python',
  'DevOps',
  'MongoDB',
];

const ClientFinder = () => {
  const [skills, setSkills] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expandedTrustId, setExpandedTrustId] = useState(null);
  const [outreachLoadingId, setOutreachLoadingId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [outreachDraft, setOutreachDraft] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);

  const toggleSkill = (skill) => {
    setError('');
    setSuccessMessage('');
    setSkills((current) =>
      current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill]
    );
  };

  const handleFindClients = async (e) => {
    e.preventDefault();
    if (skills.length === 0) {
      setError('Select at least one skill before searching.');
      return;
    }

    setLoading(true);
    setError('');
    setClients([]);
    setSuccessMessage('');
    clearVerificationCache();

    const res = await findClients(skills);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to find clients. Please try again.');
      return;
    }

    const list = Array.isArray(res.data) ? res.data : [];
    if (list.length === 0) {
      setError('No clients found. Try different skills.');
      return;
    }

    setVerifying(true);
    const withVerification = await attachVerifications(list);
    setVerifying(false);
    setClients(withVerification);

    const safeCount = withVerification.filter((c) => c.verification?.canContact).length;
    setSuccessMessage(
      `Found ${list.length} clients. ${safeCount} passed authenticity check — review trust badges before outreach.`
    );
  };

  const attachVerifications = async (list) => {
    const needVerify = [];
    const indices = [];

    list.forEach((client, index) => {
      const cached = getCachedVerification(client);
      if (!cached) {
        needVerify.push(client);
        indices.push(index);
      }
    });

    let batchResults = [];
    if (needVerify.length > 0) {
      const verifyRes = await verifyClients(needVerify);
      if (verifyRes.success) {
        batchResults = verifyRes.results || [];
        needVerify.forEach((client, i) => {
          const v = batchResults[i] || { ...fallbackVerification, trustScore: 50 };
          setCachedVerification(client, v);
        });
      }
    }

    let batchIdx = 0;
    return list.map((client) => {
      const cached = getCachedVerification(client);
      if (cached) {
        return { ...client, verification: cached, trustScore: cached.trustScore };
      }
      const v = batchResults[batchIdx] || { ...fallbackVerification, trustScore: 50 };
      batchIdx += 1;
      return { ...client, verification: v, trustScore: v.trustScore };
    });
  };

  const clientKey = (client, index) =>
    `${client.companyName || client.company || 'client'}-${index}`;

  const handleGenerateOutreach = async (client, index) => {
    if (client.verification && !client.verification.canContact) {
      setError('This client has been flagged as suspicious. Email sending is disabled.');
      return;
    }

    const key = clientKey(client, index);
    setOutreachLoadingId(key);
    setError('');
    setSuccessMessage('');

    try {
      const profile = {
        companyName: client.companyName || client.company,
        industry: client.industry || '',
        location: client.location || 'India',
        likelyNeed: client.likelyNeed || '',
        decisionMaker: client.decisionMaker || '',
        estimatedBudget: client.estimatedBudget || '',
      };

      const response = await generateOutreach(profile, skills);
      if (!response.success) {
        setError(response.error || 'Failed to generate outreach email.');
      } else {
        setSelectedClient(profile);
        setOutreachDraft({ ...response.outreach });
        setRecipientEmail('');
        setModalOpen(true);
      }
    } catch {
      setError('Unable to generate outreach email right now. Please try again.');
    }

    setOutreachLoadingId(null);
  };

  const handleCopy = async () => {
    if (!outreachDraft) return;
    await navigator.clipboard.writeText(
      `${outreachDraft.subject}\n\n${outreachDraft.body}`
    );
    setSuccessMessage('Email copied to clipboard!');
  };

  const handleSendEmail = async () => {
    if (selectedClient?.verification && !selectedClient.verification.canContact) {
      setError('This client has been flagged as suspicious. Email sending is disabled.');
      return;
    }
    if (typeof selectedClient?.trustScore === 'number' && selectedClient.trustScore < 50) {
      setError('This client has been flagged as suspicious. Email sending is disabled.');
      return;
    }

    if (!recipientEmail.trim()) {
      setError('Enter the recipient email address.');
      return;
    }
    if (!outreachDraft?.subject || !outreachDraft?.body) {
      setError('Email subject and body are required.');
      return;
    }

    setSending(true);
    setError('');
    try {
      const result = await sendOutreachFromClientFinder({
        clientProfile: selectedClient,
        recipientEmail: recipientEmail.trim(),
        subject: outreachDraft.subject,
        body: outreachDraft.body,
        skills,
        trustScore: selectedClient?.verification?.trustScore ?? selectedClient?.trustScore,
      });
      setSuccessMessage(
        `Email sent! Lead created. ${result.portalLink ? `Client link: ${result.portalLink}` : ''}`
      );
      setModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleOpenGmail = () => {
    if (!outreachDraft) return;
    const subject = encodeURIComponent(outreachDraft.subject);
    const body = encodeURIComponent(outreachDraft.body);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            AI Client Finder
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Find clients &amp; auto-generate outreach
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Select your skills, discover 10 realistic Indian client profiles powered by
            OpenRouter AI, and generate personalized cold emails for each one.
          </p>
        </header>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Your skills</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SKILL_OPTIONS.map((skill) => {
                const selected = skills.includes(skill);
                return (
                  <label
                    key={skill}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                      selected
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() => toggleSkill(skill)}
                    />
                    <span className="font-medium">{skill}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600">
              Tip: AI tailors client industries and email copy to the skills you select.
            </p>
          </section>

          <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Search</h2>
              <p className="text-sm text-slate-600">
                Region: <span className="font-medium text-slate-900">India</span>
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Selected:{' '}
                <span className="font-medium text-slate-900">
                  {skills.length > 0 ? skills.join(', ') : 'None yet'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleFindClients}
              disabled={loading || skills.length === 0}
              className="mt-6 w-full rounded-xl bg-[#0066cc] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0052a3] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? 'Finding clients…' : 'Find Clients'}
            </button>
          </section>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {successMessage && !modalOpen && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
            Searching for the best client opportunities…
          </div>
        )}

        {verifying && (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0066cc]" />
            <p className="text-sm font-medium text-slate-700">Verifying client authenticity…</p>
            <p className="mt-1 text-xs text-slate-500">Checking company, budget, and scam risk signals</p>
          </div>
        )}

        {!loading && !verifying && clients.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
            Select skills and click Find Clients to discover opportunities.
          </div>
        )}

        {!verifying && clients.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client, index) => {
            const key = clientKey(client, index);
            const company = client.companyName || client.company || 'Unknown';
            const isGenerating = outreachLoadingId === key;
            const verification = client.verification;
            const canContact = verification?.canContact !== false;
            const trustExpanded = expandedTrustId === key;

            return (
              <article
                key={key}
                className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  !canContact ? 'border-red-200 opacity-95' : 'border-slate-200'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{company}</h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {client.industry || 'Industry'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {client.location || 'India'}
                  </span>
                </div>

                <dl className="flex-1 space-y-3 text-sm text-slate-600">
                  <div>
                    <dt className="font-semibold text-slate-800">Decision maker</dt>
                    <dd>{client.decisionMaker || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-800">Likely need</dt>
                    <dd className="line-clamp-3">{client.likelyNeed || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-800">Budget</dt>
                    <dd>{client.estimatedBudget || '—'}</dd>
                  </div>
                </dl>

                {verification && (
                  <ClientTrustBadge
                    verification={verification}
                    expanded={trustExpanded}
                    onToggle={() => setExpandedTrustId(trustExpanded ? null : key)}
                  />
                )}

                {!canContact && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                    This client has been flagged as suspicious. Email sending is disabled.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleGenerateOutreach(client, index)}
                  disabled={!!outreachLoadingId || !canContact}
                  className="mt-6 w-full rounded-xl border border-slate-800 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300"
                  title={!canContact ? 'Blocked — trust score below 50' : undefined}
                >
                  {isGenerating ? 'Generating email…' : 'Generate Outreach Email'}
                </button>
              </article>
            );
          })}
        </div>
        )}
      </div>

      {modalOpen && outreachDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setModalOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="outreach-modal-title"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Outreach email
                </p>
                <h2
                  id="outreach-modal-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  {selectedClient?.companyName || 'Client'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {selectedClient?.verification && !selectedClient.verification.canContact && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                  This client has been flagged as suspicious. Email sending is disabled.
                </div>
              )}

              {selectedClient?.verification && (
                <ClientTrustBadge
                  verification={selectedClient.verification}
                  alwaysExpanded
                />
              )}

              <label className="mb-2 mt-4 block text-sm font-semibold text-slate-800">
                Recipient email *
              </label>
              <input
                type="email"
                className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                placeholder="decision.maker@company.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />

              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Subject
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                value={outreachDraft.subject}
                onChange={(e) =>
                  setOutreachDraft((d) => ({ ...d, subject: e.target.value }))
                }
              />

              <label className="mb-2 block text-sm font-semibold text-slate-800">Body</label>
              <textarea
                rows={10}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-sans text-sm leading-relaxed text-slate-700"
                value={outreachDraft.body}
                onChange={(e) =>
                  setOutreachDraft((d) => ({ ...d, body: e.target.value }))
                }
              />
              <p className="mt-2 text-xs text-slate-500">
                A unique client portal link is appended automatically when you send.
              </p>

              {successMessage && (
                <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                  {successMessage}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={handleOpenGmail}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Gmail
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={
                  sending ||
                  (selectedClient?.verification && !selectedClient.verification.canContact)
                }
                className="rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0052a3] disabled:bg-slate-300"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientFinder;
