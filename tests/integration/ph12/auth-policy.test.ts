import { describe, test, expect } from '@jest/globals';
import { trustedOrigin, sameOriginMutation } from '@/server/auth/policy';

describe('PH-12 redirect and CSRF boundary', () => {
  test('origin must be explicit HTTPS or loopback, never a forwarded host', () => {
    expect(trustedOrigin('https://phron.example')).toBe('https://phron.example');
    expect(trustedOrigin('http://127.0.0.1:3100')).toBe('http://127.0.0.1:3100');
    for (const value of [undefined, 'http://evil.test', 'https://a.test/path', 'https://user:pass@a.test', 'https://a.test?q=x']) expect(() => trustedOrigin(value)).toThrow();
  });
  test('requires a matching Origin for cookie-authenticated writes', () => {
    for (const origin of [null, 'null', 'https://evil.test']) expect(sameOriginMutation(new Headers(origin ? {origin} : {}), 'https://phron.example')).toBe(false);
    expect(sameOriginMutation(new Headers({origin:'https://phron.example'}), 'https://phron.example')).toBe(true);
    expect(sameOriginMutation(new Headers({origin:'https://phron.example','sec-fetch-site':'cross-site'}), 'https://phron.example')).toBe(false);
  });
});
