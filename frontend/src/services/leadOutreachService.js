import api from './api';

export const sendOutreachFromClientFinder = async ({
  clientProfile,
  recipientEmail,
  subject,
  body,
  skills,
  trustScore,
}) => {
  const response = await api.post('/leads/from-client-finder', {
    clientProfile,
    recipientEmail,
    subject,
    body,
    skills,
    trustScore,
  });
  return response.data;
};

export const resendLeadEmail = async (leadId, payload) => {
  const response = await api.post(`/leads/${leadId}/resend-email`, payload);
  return response.data;
};

export const sendFollowUpEmail = async (leadId, payload = {}) => {
  const response = await api.post(`/leads/${leadId}/follow-up-email`, payload);
  return response.data;
};

export const updateLeadStatus = async (leadId, status, note) => {
  const response = await api.patch(`/leads/${leadId}/status`, { status, note });
  return response.data;
};

const publicApiBase =
  process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export const getClientPortal = async (token) => {
  const response = await fetch(`${publicApiBase}/api/client/${token}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to load page');
  }
  return response.json();
};

export const respondOnPortal = async (token, data) => {
  const response = await fetch(`${publicApiBase}/api/client/${token}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit');
  }
  return response.json();
};

export const scheduleCallOnPortal = async (token, data) => {
  const response = await fetch(`${publicApiBase}/api/client/${token}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to schedule');
  }
  return response.json();
};

export const publicPortalChat = async (token, message, conversation) => {
  const response = await fetch(`${publicApiBase}/api/client/${token}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Chat failed');
  }
  return response.json();
};
