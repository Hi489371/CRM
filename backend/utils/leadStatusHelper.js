const LEAD_STATUSES = [
  'new',
  'email_sent',
  'interested',
  'negotiating',
  'won',
  'lost',
  'no_response',
  'follow_up',
  'meeting_scheduled',
  'contacted',
  'qualified',
  'proposal',
  'converted',
];

const STATUS_LABELS = {
  new: 'New',
  email_sent: 'Email Sent',
  interested: 'Interested',
  negotiating: 'Negotiating',
  won: 'Won',
  lost: 'Lost',
  no_response: 'No Response',
  follow_up: 'Follow Up',
  meeting_scheduled: 'Meeting Scheduled',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  converted: 'Converted',
};

function applyStatusChange(lead, status, note = '') {
  if (!LEAD_STATUSES.includes(status)) {
    throw new Error(`Invalid lead status: ${status}`);
  }
  lead.status = status;
  if (!lead.statusHistory) lead.statusHistory = [];
  lead.statusHistory.push({
    status,
    changedAt: new Date(),
    note: note || STATUS_LABELS[status] || status,
  });
  return lead;
}

function parseDecisionMaker(decisionMaker = '') {
  const parts = String(decisionMaker).split(',').map((s) => s.trim());
  const name = parts[0] || 'Prospect';
  const nameParts = name.split(/\s+/).filter(Boolean);
  return {
    firstName: nameParts[0] || 'Prospect',
    lastName: nameParts.slice(1).join(' ') || 'Contact',
    title: parts[1] || '',
  };
}

module.exports = {
  LEAD_STATUSES,
  STATUS_LABELS,
  applyStatusChange,
  parseDecisionMaker,
};
