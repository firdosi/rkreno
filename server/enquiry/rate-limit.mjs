import { createHash } from 'node:crypto';

export class MemoryRateLimiter {
  constructor(policy, clock = Date.now) {
    this.policy = policy;
    this.clock = clock;
    this.entries = new Map();
  }

  keyFor(ip) {
    return createHash('sha256').update(String(ip || 'unknown')).digest('hex').slice(0, 24);
  }

  prune(now) {
    for (const [key, value] of this.entries) {
      if (value.expiresAt <= now && value.blockedUntil <= now) this.entries.delete(key);
    }
    while (this.entries.size >= this.policy.maximumEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
  }

  inspect(ip) {
    const now = this.clock();
    this.prune(now);
    const key = this.keyFor(ip);
    const existing = this.entries.get(key);
    if (!existing || existing.expiresAt <= now) {
      const fresh = { accepted: 0, invalid: 0, expiresAt: now + this.policy.windowMinutes * 60000, blockedUntil: 0 };
      this.entries.set(key, fresh);
      return { allowed: true, key, entry: fresh };
    }
    return {
      allowed: existing.blockedUntil <= now && existing.accepted < this.policy.acceptedAttempts,
      key,
      entry: existing,
    };
  }

  recordAccepted(key) {
    const entry = this.entries.get(key);
    if (entry) entry.accepted += 1;
  }

  recordInvalid(key) {
    const entry = this.entries.get(key);
    if (!entry) return;
    entry.invalid += 1;
    if (entry.invalid >= this.policy.invalidStrikeLimit) {
      entry.blockedUntil = this.clock() + this.policy.temporaryBlockMinutes * 60000;
    }
  }
}
