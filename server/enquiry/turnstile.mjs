import { createHash } from 'node:crypto';

export class TurnstileValidator {
  constructor(options) {
    this.options = { timeoutMs: 4000, maximumReplayEntries: 2000, ...options };
    this.used = new Map();
  }

  tokenKey(token) {
    return createHash('sha256').update(token).digest('hex');
  }

  prune(now) {
    for (const [key, expires] of this.used) if (expires <= now) this.used.delete(key);
    while (this.used.size >= this.options.maximumReplayEntries) this.used.delete(this.used.keys().next().value);
  }

  async validate(token, remoteIp) {
    if (!token || typeof token !== 'string') return { ok: false, category: 'missing' };
    const now = Date.now();
    this.prune(now);
    const key = this.tokenKey(token);
    if (this.used.has(key)) return { ok: false, category: 'replay' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    try {
      const body = new URLSearchParams({ secret: this.options.secret, response: token });
      if (remoteIp) body.set('remoteip', remoteIp);
      const response = await this.options.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', body, signal: controller.signal,
      });
      const result = await response.json();
      if (!result.success) return { ok: false, category: 'failed' };
      if (result.hostname !== this.options.expectedHostname) return { ok: false, category: 'hostname' };
      if (result.action !== this.options.expectedAction) return { ok: false, category: 'action' };
      this.used.set(key, now + 10 * 60 * 1000);
      return { ok: true, category: 'success' };
    } catch (error) {
      return { ok: false, category: error?.name === 'AbortError' ? 'timeout' : 'unavailable' };
    } finally {
      clearTimeout(timer);
    }
  }
}

export class MockTurnstileValidator {
  constructor(results = {}) {
    this.results = results;
    this.used = new Set();
  }

  async validate(token) {
    if (this.used.has(token)) return { ok: false, category: 'replay' };
    const result = this.results[token] || { ok: false, category: 'failed' };
    if (result.ok) this.used.add(token);
    return result;
  }
}
