const cache = new Map();

export function getClientFingerprint(client) {
  if (!client) return '';
  return [
    client.companyName || client.company || '',
    client.industry || '',
    client.location || '',
    client.decisionMaker || '',
    client.likelyNeed || '',
    client.estimatedBudget || '',
  ].join('||');
}

export function getCachedVerification(client) {
  return cache.get(getClientFingerprint(client)) || null;
}

export function setCachedVerification(client, verification) {
  cache.set(getClientFingerprint(client), verification);
}

export function clearVerificationCache() {
  cache.clear();
}

export const fallbackVerification = {
  trustScore: 50,
  tier: 'medium',
  tierLabel: 'Medium Trust',
  summary: 'Verification pending',
  checks: [],
  canContact: true,
};
