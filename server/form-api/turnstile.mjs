const endpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile({ secret, token, ip, allowedHostnames }) {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return { success: false, reason: 'verification-service-error' };
  const result = await response.json();
  const validHostname = allowedHostnames.includes(result.hostname);
  const validAction = !result.action || result.action === 'contact';
  return {
    success: result.success === true && validHostname && validAction,
    reason: result.success ? (validHostname && validAction ? null : 'context-mismatch') : 'challenge-failed',
  };
}
