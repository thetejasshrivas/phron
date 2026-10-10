import { describe, expect, it } from '@jest/globals';
import { createSafeAnalyticsEvent, hasSensitiveOutboundContext } from '@/server/finance/privacy-firewall';
import { generateCoachResponse, sanitizeCoachOutput } from '@/server/finance/coach';

describe('PH-20 privacy firewall', () => {
  it.each([
    'monthly net income ₹60,000, current liquid balance ₹20,000, total debt ₹9,000; coffee ₹150 cash',
    'salary 60000 and bank balance 20000, but spent 150 on coffee',
    'email tejas@example.test UUID 123e4567-e89b-42d3-a456-426614174000 coffee 150 cash',
  ])('blocks sensitive/global context from external extraction: %s', text => {
    expect(hasSensitiveOutboundContext(text)).toBe(true);
  });

  it('allows a bounded isolated spend description', () => {
    expect(hasSensitiveOutboundContext('Coffee ₹150 cash yesterday')).toBe(false);
  });

  it('projects only the approved analytics properties and drops raw or monetary sentinels', () => {
    const event = createSafeAnalyticsEvent('transaction_logged', {
      input_type: 'nlp_single', confidence: 'high', is_estimated: false, is_credit_card: false,
      amount_paise: '15000', rupees: '₹150', merchant: 'Coffee House', raw_text: 'Coffee House 150 cash',
      monthly_net_income: '6000000', current_liquid_balance: '2000000', total_debt: '900000',
      email: 'tejas@example.test', user_uuid: '123e4567-e89b-42d3-a456-426614174000',
    });
    expect(event).toEqual({ name: 'transaction_logged', properties: { input_type: 'nlp_single', confidence: 'high', is_estimated: false, is_credit_card: false } });
    expect(JSON.stringify(event)).not.toMatch(/₹|Coffee House|15000|6000000|2000000|900000|example\.test|123e4567/i);
  });

  it('rejects telemetry events with invalid or missing enum fields', () => {
    expect(createSafeAnalyticsEvent('transaction_logged', { input_type: 'Coffee ₹150', confidence: 'high', is_estimated: false, is_credit_card: false })).toBeNull();
    expect(createSafeAnalyticsEvent('salary_confirmed', { was_on_time: true, salary: '60000' })).toEqual({ name: 'salary_confirmed', properties: { was_on_time: true } });
  });

  it('constructs empathetic coach copy only from supplied deterministic deltas', () => {
    expect(generateCoachResponse({
      overspendDeficitPaise: '120000',
      weeklyCategoryTrims: [{ category: 'Dining', amountPaise: '60000' }],
      goalPaceStatus: 'BEHIND',
    })).toBe('Setbacks happen. Your discretionary plan is ₹1,200.00 over. This week, trim Dining by ₹600.00 and check your plan. Your goal is behind its planned pace; review the next contribution when you are ready.');
  });

  it('falls back safely for hostile, shaming, or executable model text', () => {
    expect(sanitizeCoachOutput('<script>alert(1)</script>reckless, you failed')).toBe('Your confirmed numbers are still here. Review the next available step when you are ready.');
    expect(sanitizeCoachOutput('A rough week can happen.')).toBe('A rough week can happen.');
  });
});
