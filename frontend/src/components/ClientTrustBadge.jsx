import React from 'react';

const TIER_STYLES = {
  high: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢',
    label: 'High Trust',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '🟡',
    label: 'Medium Trust',
  },
  low: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    icon: '🔴',
    label: 'Low Trust',
  },
};

const checkIcon = (status) => {
  if (status === 'pass') return '✅';
  if (status === 'warn') return '⚠️';
  return '❌';
};

const ClientTrustBadge = ({ verification, expanded, onToggle, alwaysExpanded = false }) => {
  if (!verification) return null;

  const tier = verification.tier || 'medium';
  const style = TIER_STYLES[tier] || TIER_STYLES.medium;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {!alwaysExpanded ? (
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-semibold ${style.badge}`}
        >
          <span>
            {style.icon} {style.label} ({verification.trustScore}/100)
          </span>
          <span className="text-slate-500">{expanded ? '▲' : '▼'}</span>
        </button>
      ) : (
        <div
          className={`rounded-lg border px-3 py-2 text-xs font-semibold ${style.badge}`}
        >
          {style.icon} {style.label} ({verification.trustScore}/100)
        </div>
      )}

      {(alwaysExpanded || expanded) && (
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="mb-2 font-semibold text-slate-800">
            Trust Score: {verification.trustScore}/100
          </p>
          {(verification.checks || []).map((check) => (
            <p key={check.key} className="mb-1">
              {checkIcon(check.status)} {check.label}
            </p>
          ))}
          {verification.summary && (
            <p className="mt-2 italic text-slate-500">{verification.summary}</p>
          )}
          {!verification.canContact && (
            <p className="mt-2 font-semibold text-red-700">
              This client has been flagged as suspicious. Email sending is disabled.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientTrustBadge;
