import { describe, expect, it } from '@jest/globals';
import { parseExtraction, classifyExtraction, explicitPaymentMethod, parseRupeesToPaise } from '@/server/finance/extraction';

describe('PH-19 extraction validation and deterministic routing', () => {
  it.each([
    ['0'], ['0.00'], ['.50'], ['1.001'], ['1e3'], ['01'], ['-1'], ['92233720368547758.08'],
  ])('rejects invalid decimal rupee amount %s', (amount) => {
    expect(() => parseRupeesToPaise(amount)).toThrow('VALIDATION');
  });

  it.each([['1','100'], ['0.01','1'], ['500.2','50020'], ['500.20','50020'], ['90071992547409.91','9007199254740991']])(
    'converts exact rupees %s to paise %s without floating point', (amount, paise) => {
      expect(parseRupeesToPaise(amount)).toBe(paise);
    },
  );

  it('accepts only the frozen extraction fields and exact category enum', () => {
    expect(parseExtraction(JSON.stringify({ transactions: [{ amount: '0.50', merchant_or_payee: 'Cafe', candidate_category: 'Dining Out & Social', is_estimated: false, relative_date_offset_days: 0 }] }))).toEqual([
      { amountPaise: '50', merchantOrPayee: 'Cafe', candidateCategory: 'Dining Out & Social', isEstimated: false, relativeDateOffsetDays: 0 },
    ]);
    expect(() => parseExtraction('{"transactions":[],"balance":"999"}')).toThrow('VALIDATION');
    expect(() => parseExtraction('{"transactions":[{"amount":"10","merchant_or_payee":"X","candidate_category":"Custom","is_estimated":false,"relative_date_offset_days":0}]}')).toThrow('VALIDATION');
  });

  it('routes known merchants high, multi-category platforms medium and P2P or no-context low', () => {
    expect(classifyExtraction({ merchantOrPayee: 'Zomato', candidateCategory: 'Dining Out & Social', isEstimated: false, localMemoryHit: false, sourceText: '450 Zomato' })).toEqual({ confidence: 'HIGH', action: 'DIRECT_COMMIT' });
    expect(classifyExtraction({ merchantOrPayee: 'Amazon', candidateCategory: 'Shopping & Personal', isEstimated: false, localMemoryHit: false, sourceText: 'Amazon 500' })).toEqual({ confidence: 'MEDIUM', action: 'COMMIT_WITH_SWAP' });
    expect(classifyExtraction({ merchantOrPayee: 'Rahul', candidateCategory: 'Unallocated / Lent', isEstimated: false, localMemoryHit: false, sourceText: 'Rahul 500' })).toEqual({ confidence: 'LOW', action: 'CLARIFY' });
    expect(classifyExtraction({ merchantOrPayee: '', candidateCategory: 'Unknown', isEstimated: false, localMemoryHit: false, sourceText: '500' })).toEqual({ confidence: 'LOW', action: 'CLARIFY' });
    expect(classifyExtraction({ merchantOrPayee: 'Cafe', candidateCategory: 'Dining Out & Social', isEstimated: false, localMemoryHit: true, sourceText: '450 Cafe' })).toEqual({ confidence: 'HIGH', action: 'DIRECT_COMMIT' });
  });

  it('detects only explicit payment methods and does not default missing method to cash', () => {
    expect(explicitPaymentMethod('paid 500 by debit card')).toBe('debit');
    expect(explicitPaymentMethod('Zomato 500 on credit card')).toBe('card');
    expect(explicitPaymentMethod('500 via UPI')).toBe('upi');
    expect(explicitPaymentMethod('500 at Zomato')).toBeNull();
  });
});
