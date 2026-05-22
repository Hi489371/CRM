import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  getClientPortal,
  respondOnPortal,
  scheduleCallOnPortal,
  publicPortalChat,
} from '../services/leadOutreachService';
import '../styles/ClientPortal.css';

const ClientPortal = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('main');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [requirements, setRequirements] = useState({
    name: '',
    company: '',
    projectDescription: '',
    budgetRange: '',
    timeline: '',
  });
  const [schedule, setSchedule] = useState({ name: '', phone: '', preferredTime: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPortal();
  }, [token]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const loadPortal = async () => {
    try {
      setLoading(true);
      const res = await getClientPortal(token);
      setData(res);
      setRequirements((r) => ({ ...r, company: res.client?.companyName || '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInterested = async () => {
    setSubmitting(true);
    try {
      await respondOnPortal(token, { action: 'interested' });
      setView('requirements');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotInterested = async () => {
    setSubmitting(true);
    try {
      await respondOnPortal(token, { action: 'not_interested' });
      setView('thanks-no');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitRequirements = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await respondOnPortal(token, { action: 'interested', requirements });
      setView('thanks-yes');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await scheduleCallOnPortal(token, schedule);
      setView('thanks-schedule');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    const userMsg = { role: 'user', content: trimmed };
    const nextConvo = [...chatMessages, userMsg];
    setChatMessages(nextConvo);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await publicPortalChat(token, trimmed, chatMessages);
      setChatMessages([...nextConvo, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setChatMessages([...nextConvo, { role: 'assistant', content: `Sorry, ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <div className="portal-page"><div className="portal-card">Loading your proposal…</div></div>;
  }

  if (error && !data) {
    return <div className="portal-page"><div className="portal-card portal-error">{error}</div></div>;
  }

  const { company, client, proposal } = data;

  return (
    <div className="portal-page">
      <header className="portal-hero">
        <p className="portal-eyebrow">Personalized proposal</p>
        <h1>{company?.name}</h1>
        <p className="portal-tagline">{company?.tagline}</p>
      </header>

      <div className="portal-container">
        {error && <div className="portal-banner error">{error}</div>}

        {view === 'main' && (
          <>
            <section className="portal-card">
              <h2>Hello, {client?.decisionMaker}</h2>
              <p className="portal-muted">
                Prepared for <strong>{client?.companyName}</strong> · {client?.industry} · {client?.location}
              </p>
              <p>{company?.description}</p>
              <div className="portal-meta">
                <span><strong>Focus:</strong> {client?.likelyNeed}</span>
                <span><strong>Budget:</strong> {client?.estimatedBudget}</span>
              </div>
            </section>

            {proposal && (
              <section className="portal-card proposal-box">
                <h3>Your proposal</h3>
                <pre>{proposal.replace(/^Subject:.*?\n\n/s, '')}</pre>
              </section>
            )}

            <section className="portal-card">
              <h3>How would you like to proceed?</h3>
              <div className="portal-actions">
                <button type="button" className="portal-btn success" onClick={handleInterested} disabled={submitting}>
                  ✅ Interested
                </button>
                <button type="button" className="portal-btn primary" onClick={() => setView('schedule')} disabled={submitting}>
                  📅 Schedule a Call
                </button>
                <button type="button" className="portal-btn muted" onClick={handleNotInterested} disabled={submitting}>
                  ❌ Not Interested
                </button>
              </div>
              <button type="button" className="portal-btn outline chat-toggle" onClick={() => setChatOpen(!chatOpen)}>
                💬 Chat with us
              </button>
            </section>
          </>
        )}

        {view === 'requirements' && (
          <section className="portal-card">
            <h2>Tell us about your project</h2>
            <form onSubmit={submitRequirements} className="portal-form">
              <input placeholder="Your name *" required value={requirements.name} onChange={(e) => setRequirements({ ...requirements, name: e.target.value })} />
              <input placeholder="Company" value={requirements.company} onChange={(e) => setRequirements({ ...requirements, company: e.target.value })} />
              <textarea placeholder="Project description *" required rows={4} value={requirements.projectDescription} onChange={(e) => setRequirements({ ...requirements, projectDescription: e.target.value })} />
              <input placeholder="Budget range *" required value={requirements.budgetRange} onChange={(e) => setRequirements({ ...requirements, budgetRange: e.target.value })} />
              <input placeholder="Timeline *" required value={requirements.timeline} onChange={(e) => setRequirements({ ...requirements, timeline: e.target.value })} />
              <button type="submit" className="portal-btn primary" disabled={submitting}>Submit requirements</button>
            </form>
          </section>
        )}

        {view === 'schedule' && (
          <section className="portal-card">
            <h2>Schedule a call</h2>
            <form onSubmit={submitSchedule} className="portal-form">
              <input placeholder="Your name *" required value={schedule.name} onChange={(e) => setSchedule({ ...schedule, name: e.target.value })} />
              <input placeholder="Phone *" required value={schedule.phone} onChange={(e) => setSchedule({ ...schedule, phone: e.target.value })} />
              <input placeholder="Preferred date/time *" required value={schedule.preferredTime} onChange={(e) => setSchedule({ ...schedule, preferredTime: e.target.value })} />
              <button type="submit" className="portal-btn primary" disabled={submitting}>Request call</button>
              <button type="button" className="portal-btn muted" onClick={() => setView('main')}>Back</button>
            </form>
          </section>
        )}

        {view === 'thanks-yes' && (
          <section className="portal-card thanks">
            <h2>Thank you!</h2>
            <p>We received your requirements and will get back to you shortly.</p>
          </section>
        )}

        {view === 'thanks-no' && (
          <section className="portal-card thanks">
            <h2>Thank you for your time</h2>
            <p>We appreciate your response. Wishing you and {client?.companyName} all the best.</p>
          </section>
        )}

        {view === 'thanks-schedule' && (
          <section className="portal-card thanks">
            <h2>Call request received</h2>
            <p>Our team will contact you at your preferred time.</p>
          </section>
        )}

        {chatOpen && (
          <section className="portal-card portal-chat">
            <h3>Chat with {company?.name}</h3>
            <div className="chat-messages">
              {chatMessages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
              ))}
              {chatLoading && <div className="chat-bubble assistant">Typing…</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-row">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a question…" onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
              <button type="button" className="portal-btn primary" onClick={sendChat} disabled={chatLoading}>Send</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ClientPortal;
