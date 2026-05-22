import React, { useState } from 'react';
import { writeProposal } from '../services/aiService';

const ProposalWriter = () => {
  const [form, setForm] = useState({
    clientName: '',
    company: '',
    scope: '',
    budget: '',
    timeline: '',
    technologies: '',
    yourName: '',
  });
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '40px 20px',
    },
    wrapper: {
      maxWidth: '900px',
      margin: '0 auto',
    },
    header: {
      background: '#ffffff',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    headerTitle: {
      fontSize: '12px',
      letterSpacing: '0.15em',
      color: '#64748b',
      textTransform: 'uppercase',
      marginBottom: '8px',
    },
    headerMain: {
      fontSize: '32px',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '12px',
    },
    formCard: {
      background: '#ffffff',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    formGroup: {
      marginBottom: '24px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#1e293b',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'all 0.2s',
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      fontSize: '14px',
      color: '#1e293b',
      fontFamily: 'inherit',
      minHeight: '100px',
      resize: 'vertical',
      boxSizing: 'border-box',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    button: (disabled) => ({
      padding: '12px 24px',
      borderRadius: '20px',
      background: disabled ? '#cbd5e1' : '#1e293b',
      color: '#ffffff',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      width: '100%',
    }),
    error: {
      background: '#fee2e2',
      borderRadius: '20px',
      border: '1px solid #fecaca',
      padding: '16px',
      color: '#991b1b',
      fontSize: '14px',
      marginTop: '20px',
    },
    success: {
      background: '#dcfce7',
      borderRadius: '20px',
      border: '1px solid #bbf7d0',
      padding: '16px',
      color: '#166534',
      fontSize: '14px',
      marginTop: '20px',
    },
    resultCard: {
      background: '#ffffff',
      borderRadius: '24px',
      border: '1px solid #e2e8f0',
      padding: '32px',
      marginTop: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    resultText: {
      fontSize: '13px',
      color: '#334155',
      lineHeight: '1.8',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      background: '#f8fafc',
      borderRadius: '16px',
      padding: '20px',
      marginTop: '16px',
      maxHeight: '500px',
      overflowY: 'auto',
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    setSuccessMessage('');

    const res = await writeProposal(
      form.clientName,
      form.company,
      form.scope,
      form.budget,
      form.timeline,
      form.technologies,
      form.yourName
    );

    if (res.success) {
      setResult(res.proposal);
      setSuccessMessage('✅ Proposal generated successfully!');
    } else {
      setError(res.error || 'Failed to generate proposal. Please try again.');
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setSuccessMessage('✅ Proposal copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to copy. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <p style={styles.headerTitle}>AI Proposal Writer</p>
          <h1 style={styles.headerMain}>Create professional project proposals</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '12px' }}>
            Fill in your project details and AI will generate a complete, professional proposal document.
          </p>
        </div>

        <form onSubmit={handleGenerate} style={styles.formCard}>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Client Name *</label>
              <input
                type="text"
                name="clientName"
                placeholder="e.g., John Smith"
                value={form.clientName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Company *</label>
              <input
                type="text"
                name="company"
                placeholder="e.g., Tech Startup Inc."
                value={form.company}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Project Scope *</label>
            <textarea
              name="scope"
              placeholder="Describe what you'll deliver: features, timeline, deliverables, etc."
              value={form.scope}
              onChange={handleChange}
              style={styles.textarea}
              required
            />
          </div>

          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Budget Quote *</label>
              <input
                type="text"
                name="budget"
                placeholder="e.g., $25,000"
                value={form.budget}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Timeline *</label>
              <input
                type="text"
                name="timeline"
                placeholder="e.g., 3 months"
                value={form.timeline}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Technologies (Optional)</label>
              <input
                type="text"
                name="technologies"
                placeholder="e.g., React, Node.js, AWS"
                value={form.technologies}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Name / Brand *</label>
              <input
                type="text"
                name="yourName"
                placeholder="Your name or company name"
                value={form.yourName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          {error && <div style={styles.error}>❌ {error}</div>}
          {successMessage && <div style={styles.success}>{successMessage}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button(loading),
              marginTop: '24px',
            }}
          >
            {loading ? '✍️ Writing Proposal...' : '✍️ Generate Proposal'}
          </button>
        </form>

        {result && (
          <div style={styles.resultCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0' }}>📄 Generated Proposal</h3>
              <button
                onClick={copyToClipboard}
                style={{
                  ...styles.button(false),
                  width: 'auto',
                  padding: '10px 16px',
                }}
              >
                📋 Copy
              </button>
            </div>
            <div style={styles.resultText}>{result}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalWriter;
