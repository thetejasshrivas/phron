import { describe, expect, it } from '@jest/globals';
import { sanitizeCaptureText } from '@/server/finance/ingestion-input';

describe('sanitizeCaptureText', () => {
  it('accepts exactly 280 Unicode code points', () => {
    expect(sanitizeCaptureText('₹'.repeat(280))).toHaveLength(280);
  });

  it('rejects text longer than 280 Unicode code points', () => {
    expect(() => sanitizeCaptureText('₹'.repeat(281))).toThrow('VALIDATION');
  });

  it('removes non-printable controls without altering ordinary text', () => {
    expect(sanitizeCaptureText('paid\u0000 450\u007f for lunch')).toBe('paid 450 for lunch');
  });

  it('removes complete script elements and rejects orphan script tags', () => {
    expect(sanitizeCaptureText('450 lunch <script>alert(1)</script>')).toBe('450 lunch');
    expect(() => sanitizeCaptureText('450 lunch <script>alert(1)')).toThrow('VALIDATION');
  });

  it('rejects non-string inputs', () => {
    expect(() => sanitizeCaptureText({ text: '450 lunch' })).toThrow('VALIDATION');
  });
});
