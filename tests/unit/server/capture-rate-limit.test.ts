import { expect, it } from '@jest/globals';
import { createCaptureRateLimiter } from '@/server/finance/capture-rate-limit';

it('permits ten requests, denies the eleventh, and isolates users', () => {
  const limit = createCaptureRateLimiter(() => 0);
  for (let i = 0; i < 10; i++) expect(limit.consume('A')).toEqual({ allowed: true });
  expect(limit.consume('A')).toEqual({ allowed: false, retryAfterSeconds: 60 });
  expect(limit.consume('B')).toEqual({ allowed: true });
});
it('expires each request at its own exact sliding-window boundary', () => {
  let now = 0; const limit = createCaptureRateLimiter(() => now);
  limit.consume('A'); now = 1000;
  for (let i = 0; i < 9; i++) limit.consume('A');
  now = 59_001; expect(limit.consume('A')).toEqual({ allowed: false, retryAfterSeconds: 1 });
  now = 60_000; expect(limit.consume('A')).toEqual({ allowed: true });
  expect(limit.consume('A')).toEqual({ allowed: false, retryAfterSeconds: 1 });
  now = 61_000; expect(limit.consume('A')).toEqual({ allowed: true });
});
it('does not extend the window on rejected attempts and prunes inactive users', () => {
  let now = 0; const limit = createCaptureRateLimiter(() => now);
  for (let i = 0; i < 10; i++) limit.consume('A');
  now = 59_000; limit.consume('A');
  now = 60_000; limit.consume('B');
  expect(limit.consume('A')).toEqual({ allowed: true });
});
it('synchronously bounds a burst of concurrent arrivals', async () => {
  const limit = createCaptureRateLimiter(() => 0);
  const results = await Promise.all(Array.from({ length: 25 }, async () => limit.consume('A')));
  expect(results.filter(result => result.allowed)).toHaveLength(10);
});
