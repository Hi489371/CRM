import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leadService } from '../services';
import {
  resendLeadEmail,
  sendFollowUpEmail,
  updateLeadStatus,
} from '../services/leadOutreachService';
import '../styles/Leads.css';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'interested', label: 'Interested' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'no_response', label: 'No Response' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
];

const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

export const LeadDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const data = await leadService.getLead(id);
      setLead(data);
      setStatus(data.status);
      setEmailSubject(data.emailSubject || '');
      setEmailBody(data.proposalSent?.replace(/^Subject:.*?\n\n/s, '') || '');
    } catch {
      setError('Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id && id !== 'new') fetchLead();
  }, [id, fetchLead]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateLeadStatus(id, newStatus, 'Manual update from lead detail');
      setStatus(newStatus);
      setSuccess('Status updated');
      fetchLead();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      await resendLeadEmail(id, { subject: emailSubject, body: emailBody });
      setSuccess('Email sent successfully');
      fetchLead();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleFollowUp = async () => {
    setSending(true);
    try {
      await sendFollowUpEmail(id, { subject: emailSubject, body: emailBody });
      setSuccess('Follow-up email sent');
      fetchLead();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send follow-up');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!lead) return <div className="error-banner">{error || 'Lead not found'}</div>;

  const portalUrl = lead.token
    ? `${window.location.origin}/client/${lead.token}`
    : null;

  return (
    <div className="lead-detail outreach-detail">
      <button className="btn-secondary" onClick={() => navigate('/leads')}>
        ← Back to Leads
      </button>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="lead-detail-header">
        <div>
          <h1>
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="lead-subtitle">
            {lead.company} · {lead.industry || '—'} · {lead.location || '—'}
          </p>
        </div>
        <span className={`status-badge ${lead.status}`}>
          {lead.statusLabel || lead.status}
        </span>
      </div>

      <div className="lead-detail-grid">
        <section className="detail-card">
          <h3>Status</h3>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="filter-select"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {portalUrl && (
            <p className="portal-link">
              Public page:{' '}
              <a href={portalUrl} target="_blank" rel="noreferrer">
                {portalUrl}
              </a>
            </p>
          )}
        </section>

        <section className="detail-card">
          <h3>Contact</h3>
          <p>
            <strong>Email:</strong> {lead.email}
          </p>
          <p>
            <strong>Phone:</strong> {lead.phone || '—'}
          </p>
          <p>
            <strong>Decision maker:</strong> {lead.decisionMakerTitle || '—'}
          </p>
          <p>
            <strong>Likely need:</strong> {lead.likelyNeed || '—'}
          </p>
          <p>
            <strong>Budget:</strong> {lead.estimatedBudget || '—'}
          </p>
        </section>

        <section className="detail-card full-width">
          <h3>Proposal / email sent</h3>
          <label>Subject</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="search-input"
          />
          <label>Body</label>
          <textarea
            rows={8}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="search-input"
          />
          <div className="detail-actions">
            <button className="btn-primary" onClick={handleResend} disabled={sending}>
              Re-send email
            </button>
            <button className="btn-secondary" onClick={handleFollowUp} disabled={sending}>
              Send follow-up
            </button>
          </div>
        </section>

        {lead.clientResponse?.requirements?.submittedAt && (
          <section className="detail-card full-width">
            <h3>Requirements submitted</h3>
            <pre className="detail-pre">
              {JSON.stringify(lead.clientResponse.requirements, null, 2)}
            </pre>
          </section>
        )}

        {lead.clientResponse?.scheduledCall?.submittedAt && (
          <section className="detail-card full-width">
            <h3>Scheduled call</h3>
            <p>
              <strong>Name:</strong> {lead.clientResponse.scheduledCall.name}
            </p>
            <p>
              <strong>Phone:</strong> {lead.clientResponse.scheduledCall.phone}
            </p>
            <p>
              <strong>Preferred time:</strong>{' '}
              {lead.clientResponse.scheduledCall.preferredTime}
            </p>
            <p>
              <strong>Submitted:</strong>{' '}
              {formatDate(lead.clientResponse.scheduledCall.submittedAt)}
            </p>
          </section>
        )}

        <section className="detail-card full-width">
          <h3>Status timeline</h3>
          <ul className="status-timeline">
            {(lead.statusHistory || [])
              .slice()
              .reverse()
              .map((entry, idx) => (
                <li key={`${entry.status}-${idx}`}>
                  <span className={`status-badge small ${entry.status}`}>
                    {entry.status}
                  </span>
                  <span className="timeline-note">{entry.note}</span>
                  <span className="timeline-date">{formatDate(entry.changedAt)}</span>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default LeadDetailView;
