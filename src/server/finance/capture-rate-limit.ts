type LimitResult = { readonly allowed: true } | { readonly allowed: false; readonly retryAfterSeconds: number };
export type CaptureThrottledResponse = {
  readonly kind: 'manual_fallback';
  readonly reason: 'rate_limited';
  readonly openManualEntry: true;
  readonly retryAfterSeconds: number;
};

/** Process-local sliding window. Not a distributed/serverless quota guarantee. */
export function createCaptureRateLimiter(now: () => number = Date.now) {
  const arrivals = new Map<string, number[]>();
  return {
    consume(userId: string): LimitResult {
      const time = now();
      // Retain only the current window, including for inactive users.
      for (const [id, times] of arrivals) {
        const active = times.filter(at => at > time - 60_000);
        if (active.length) arrivals.set(id, active); else arrivals.delete(id);
      }
      const times = arrivals.get(userId) ?? [];
      if (times.length >= 10) return { allowed: false, retryAfterSeconds: Math.ceil((times[0]! + 60_000 - time) / 1000) };
      times.push(time);
      arrivals.set(userId, times);
      return { allowed: true };
    },
  };
}

export const captureRateLimiter = createCaptureRateLimiter();
