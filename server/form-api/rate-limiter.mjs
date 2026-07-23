export class RateLimiter {
  #entries = new Map();

  constructor({ maxRequests, windowMs }) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  consume(key, now = Date.now()) {
    const current = this.#entries.get(key);
    if (!current || current.resetAt <= now) {
      if (!current && this.#entries.size >= 10_000) {
        this.sweep(now);
        if (this.#entries.size >= 10_000) {
          this.#entries.delete(this.#entries.keys().next().value);
        }
      }
      const resetAt = now + this.windowMs;
      this.#entries.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt };
    }
    current.count += 1;
    return {
      allowed: current.count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - current.count),
      resetAt: current.resetAt,
    };
  }

  sweep(now = Date.now()) {
    for (const [key, value] of this.#entries) {
      if (value.resetAt <= now) this.#entries.delete(key);
    }
  }
}
